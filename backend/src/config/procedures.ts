import { logger } from '../utils/logger';

/**
 * Initialize all PostgreSQL PL/pgSQL stored procedures and supporting tables.
 * Called once at server startup after triggers are initialized.
 */
export async function initProcedures(sql: any): Promise<void> {
    try {
        // ============================================================
        // SUPPORTING TABLE 1: ownership_transfer_log
        // Logs every ownership transfer made via sp_transfer_ownership
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS ownership_transfer_log (
                transfer_id SERIAL PRIMARY KEY,
                product_id INT NOT NULL,
                from_user_id VARCHAR(255) NOT NULL,
                to_user_id VARCHAR(255) NOT NULL,
                product_name VARCHAR(255),
                transferred_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // ============================================================
        // SUPPORTING TABLE 2: products_archive
        // Stores products purged by sp_purge_expired_products
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS products_archive (
                archive_id SERIAL PRIMARY KEY,
                original_id INT,
                "userId" VARCHAR(255),
                name VARCHAR(255),
                brand VARCHAR(255),
                model VARCHAR(255),
                "serialNumber" VARCHAR(255),
                category VARCHAR(255),
                "purchaseDate" VARCHAR(255),
                "purchasePrice" NUMERIC(10, 2),
                "warrantyExpiry" VARCHAR(255),
                notes TEXT,
                "originalCreatedAt" TIMESTAMP,
                archived_at TIMESTAMP DEFAULT NOW()
            )
        `;

        logger.info('Procedure support tables created successfully');

        // ============================================================
        // PROCEDURE 1: sp_register_product
        // Full product registration in a single atomic PL/pgSQL block.
        // Inserts the product row and lets existing triggers handle
        // audit logging + warranty status sync automatically.
        // ============================================================
        await sql`
            CREATE OR REPLACE PROCEDURE sp_register_product(
                p_user_id VARCHAR,
                p_name VARCHAR,
                p_brand VARCHAR DEFAULT '',
                p_model VARCHAR DEFAULT '',
                p_serial_number VARCHAR DEFAULT '',
                p_category VARCHAR DEFAULT '',
                p_purchase_date VARCHAR DEFAULT '',
                p_purchase_price NUMERIC DEFAULT 0,
                p_warranty_expiry VARCHAR DEFAULT '',
                p_notes TEXT DEFAULT ''
            )
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_product_id INT;
            BEGIN
                -- Validate required fields
                IF p_name IS NULL OR TRIM(p_name) = '' THEN
                    RAISE EXCEPTION 'Product name is required';
                END IF;

                IF p_purchase_price < 0 THEN
                    RAISE EXCEPTION 'Purchase price cannot be negative. Got: %', p_purchase_price;
                END IF;

                -- Insert the product (triggers will handle audit + warranty status)
                INSERT INTO products (
                    "userId", name, brand, model, "serialNumber",
                    category, "purchaseDate", "purchasePrice",
                    "warrantyExpiry", notes
                )
                VALUES (
                    p_user_id, TRIM(p_name), p_brand, p_model, p_serial_number,
                    p_category, p_purchase_date, p_purchase_price,
                    p_warranty_expiry, p_notes
                )
                RETURNING id INTO v_product_id;

                -- Log success
                RAISE NOTICE 'Product registered with ID: %', v_product_id;
            END;
            $$
        `;

        // ============================================================
        // PROCEDURE 2: sp_transfer_ownership
        // Transfers product from one user to another.
        // Validates ownership, updates userId, logs the transfer.
        // ============================================================
        await sql`
            CREATE OR REPLACE PROCEDURE sp_transfer_ownership(
                p_product_id INT,
                p_from_user_id VARCHAR,
                p_to_user_id VARCHAR
            )
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_product_name VARCHAR;
                v_current_owner VARCHAR;
            BEGIN
                -- Validate inputs
                IF p_from_user_id = p_to_user_id THEN
                    RAISE EXCEPTION 'Cannot transfer product to the same user';
                END IF;

                -- Verify the product exists and belongs to from_user
                SELECT name, "userId" INTO v_product_name, v_current_owner
                FROM products
                WHERE id = p_product_id;

                IF v_product_name IS NULL THEN
                    RAISE EXCEPTION 'Product with ID % not found', p_product_id;
                END IF;

                IF v_current_owner <> p_from_user_id THEN
                    RAISE EXCEPTION 'Product % does not belong to user %', p_product_id, p_from_user_id;
                END IF;

                -- Perform the transfer
                UPDATE products
                SET "userId" = p_to_user_id,
                    "updatedAt" = NOW()
                WHERE id = p_product_id;

                -- Log the transfer
                INSERT INTO ownership_transfer_log (product_id, from_user_id, to_user_id, product_name)
                VALUES (p_product_id, p_from_user_id, p_to_user_id, v_product_name);

                RAISE NOTICE 'Product "%" (ID: %) transferred from % to %',
                    v_product_name, p_product_id, p_from_user_id, p_to_user_id;
            END;
            $$
        `;

        // ============================================================
        // PROCEDURE 3: sp_bulk_update_warranty_status
        // Re-computes warranty_status for all products of a given user.
        // Useful for daily batch recalculation or on-demand refresh.
        // ============================================================
        await sql`
            CREATE OR REPLACE PROCEDURE sp_bulk_update_warranty_status(
                p_user_id VARCHAR
            )
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_rec RECORD;
                v_status VARCHAR(50);
                v_days INT;
                v_expiry DATE;
                v_count INT := 0;
            BEGIN
                FOR v_rec IN
                    SELECT id, "warrantyExpiry"
                    FROM products
                    WHERE "userId" = p_user_id
                LOOP
                    -- Try to parse warrantyExpiry as a date
                    BEGIN
                        v_expiry := v_rec."warrantyExpiry"::DATE;
                    EXCEPTION WHEN OTHERS THEN
                        v_expiry := NULL;
                    END;

                    IF v_expiry IS NULL OR v_rec."warrantyExpiry" = '' THEN
                        v_status := 'no_warranty';
                        v_days := 0;
                    ELSE
                        v_days := (v_expiry - CURRENT_DATE);
                        IF v_days < 0 THEN
                            v_status := 'expired';
                        ELSIF v_days <= 30 THEN
                            v_status := 'expiring_soon';
                        ELSE
                            v_status := 'active';
                        END IF;
                    END IF;

                    INSERT INTO warranty_status (product_id, status, days_remaining, last_checked)
                    VALUES (v_rec.id, v_status, v_days, NOW())
                    ON CONFLICT (product_id) DO UPDATE
                    SET status = EXCLUDED.status,
                        days_remaining = EXCLUDED.days_remaining,
                        last_checked = EXCLUDED.last_checked;

                    v_count := v_count + 1;
                END LOOP;

                RAISE NOTICE 'Updated warranty status for % products (user: %)', v_count, p_user_id;
            END;
            $$
        `;

        // ============================================================
        // PROCEDURE 4: sp_purge_expired_products
        // Archives and deletes products whose warranty expired more
        // than N days ago. Moves them to products_archive first.
        // ============================================================
        await sql`
            CREATE OR REPLACE PROCEDURE sp_purge_expired_products(
                p_user_id VARCHAR,
                p_days_past_expiry INT DEFAULT 365
            )
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_rec RECORD;
                v_expiry DATE;
                v_archived INT := 0;
            BEGIN
                FOR v_rec IN
                    SELECT *
                    FROM products
                    WHERE "userId" = p_user_id
                      AND "warrantyExpiry" <> ''
                LOOP
                    -- Try to parse warrantyExpiry
                    BEGIN
                        v_expiry := v_rec."warrantyExpiry"::DATE;
                    EXCEPTION WHEN OTHERS THEN
                        CONTINUE;  -- skip unparseable dates
                    END;

                    -- Check if expired beyond threshold
                    IF v_expiry IS NOT NULL AND (CURRENT_DATE - v_expiry) > p_days_past_expiry THEN
                        -- Archive the product
                        INSERT INTO products_archive (
                            original_id, "userId", name, brand, model,
                            "serialNumber", category, "purchaseDate",
                            "purchasePrice", "warrantyExpiry", notes,
                            "originalCreatedAt"
                        )
                        VALUES (
                            v_rec.id, v_rec."userId", v_rec.name, v_rec.brand, v_rec.model,
                            v_rec."serialNumber", v_rec.category, v_rec."purchaseDate",
                            v_rec."purchasePrice", v_rec."warrantyExpiry", v_rec.notes,
                            v_rec."createdAt"
                        );

                        -- Delete from products (triggers will log the DELETE in audit)
                        DELETE FROM products WHERE id = v_rec.id;

                        v_archived := v_archived + 1;
                    END IF;
                END LOOP;

                RAISE NOTICE 'Archived and purged % expired products for user %', v_archived, p_user_id;
            END;
            $$
        `;

        // ============================================================
        // FUNCTION 5: sp_generate_product_report
        // Returns aggregated statistics for a user's products.
        // Uses RETURNS TABLE so the caller gets structured data back.
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION sp_generate_product_report(
                p_user_id VARCHAR
            )
            RETURNS TABLE (
                report_type VARCHAR,
                label VARCHAR,
                value NUMERIC
            )
            LANGUAGE plpgsql
            AS $$
            BEGIN
                -- 1. Product count by category
                RETURN QUERY
                SELECT
                    'category_count'::VARCHAR AS report_type,
                    COALESCE(NULLIF(p.category, ''), 'Uncategorized')::VARCHAR AS label,
                    COUNT(*)::NUMERIC AS value
                FROM products p
                WHERE p."userId" = p_user_id
                GROUP BY p.category;

                -- 2. Warranty status breakdown
                RETURN QUERY
                SELECT
                    'warranty_status'::VARCHAR AS report_type,
                    ws.status::VARCHAR AS label,
                    COUNT(*)::NUMERIC AS value
                FROM warranty_status ws
                JOIN products p ON ws.product_id = p.id
                WHERE p."userId" = p_user_id
                GROUP BY ws.status;

                -- 3. Total purchase value
                RETURN QUERY
                SELECT
                    'total_value'::VARCHAR AS report_type,
                    'total_purchase_value'::VARCHAR AS label,
                    COALESCE(SUM(p."purchasePrice"), 0)::NUMERIC AS value
                FROM products p
                WHERE p."userId" = p_user_id;

                -- 4. Total product count
                RETURN QUERY
                SELECT
                    'total_count'::VARCHAR AS report_type,
                    'total_products'::VARCHAR AS label,
                    COUNT(*)::NUMERIC AS value
                FROM products p
                WHERE p."userId" = p_user_id;

                -- 5. Average product price
                RETURN QUERY
                SELECT
                    'average'::VARCHAR AS report_type,
                    'average_price'::VARCHAR AS label,
                    COALESCE(AVG(p."purchasePrice"), 0)::NUMERIC AS value
                FROM products p
                WHERE p."userId" = p_user_id;

                -- 6. Products archived count
                RETURN QUERY
                SELECT
                    'archived'::VARCHAR AS report_type,
                    'archived_products'::VARCHAR AS label,
                    COUNT(*)::NUMERIC AS value
                FROM products_archive pa
                WHERE pa."userId" = p_user_id;
            END;
            $$
        `;

        logger.info('All 5 PL/pgSQL stored procedures created successfully');

    } catch (error) {
        logger.error('Failed to initialize stored procedures:', error);
        throw error;
    }
}
