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

                -- Validate warranty dates
                IF p_purchase_date IS NOT NULL AND TRIM(p_purchase_date) <> '' AND p_warranty_expiry IS NOT NULL AND TRIM(p_warranty_expiry) <> '' THEN
                    BEGIN
                        IF p_warranty_expiry::DATE < p_purchase_date::DATE THEN
                            RAISE EXCEPTION 'Warranty expiry date cannot be before the purchase date.';
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore parse errors
                    END;
                END IF;

                -- Prevent duplicate serial
                IF p_serial_number IS NOT NULL AND TRIM(p_serial_number) <> '' THEN
                    IF EXISTS (SELECT 1 FROM products WHERE "userId" = p_user_id AND "serialNumber" = TRIM(p_serial_number)) THEN
                        RAISE EXCEPTION 'A product with serial number "%" already exists in your vault.', TRIM(p_serial_number);
                    END IF;
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

        // ============================================================
        // SUPPORTING TABLE 6: password_change_audit
        // Tracks every password-change attempt (success + failure)
        // so administrators can audit suspicious activity.
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS password_change_audit (
                audit_id      SERIAL PRIMARY KEY,
                user_id       VARCHAR(255) NOT NULL,
                attempted_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
                outcome       VARCHAR(20)  NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILED')),
                failure_reason VARCHAR(255)
            )
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_pwd_audit_user
            ON password_change_audit(user_id)
        `;

        logger.info('password_change_audit table ready');

        // ============================================================
        // FUNCTION 6: fn_validate_password_change
        //
        // PL/pgSQL gate called BEFORE touching MongoDB.
        // Responsibilities:
        //   1. Validate all inputs are non-empty.
        //   2. Enforce minimum password length (>= 6 chars).
        //   3. Reject if new password == current password.
        //   4. Insert an audit row (SUCCESS or FAILED).
        //   5. RAISE typed exceptions so the caller gets clean msgs.
        //
        // Parameters:
        //   p_user_id        – MongoDB ObjectId (stored as text)
        //   p_new_password   – plaintext new password (pre-hash check)
        //   p_current_pw_ok  – boolean from bcrypt result (Node sends it)
        //
        // Returns: VOID on success, raises on any validation failure.
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_validate_password_change(
                p_user_id       VARCHAR,
                p_new_password  TEXT,
                p_current_pw_ok BOOLEAN
            )
            RETURNS VOID
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_failure_reason VARCHAR(255) := NULL;
            BEGIN
                -- ── Guard: user_id must be provided ───────────────────
                IF p_user_id IS NULL OR TRIM(p_user_id) = '' THEN
                    RAISE EXCEPTION 'User ID is required'
                        USING ERRCODE = 'VW001';
                END IF;

                -- ── Guard: new password must be provided ──────────────
                IF p_new_password IS NULL OR TRIM(p_new_password) = '' THEN
                    v_failure_reason := 'New password is empty';
                    BEGIN
                        INSERT INTO password_change_audit (user_id, outcome, failure_reason)
                        VALUES (p_user_id, 'FAILED', v_failure_reason);
                    EXCEPTION WHEN OTHERS THEN
                        NULL;  -- audit insert must never block the exception
                    END;
                    RAISE EXCEPTION 'New password cannot be empty'
                        USING ERRCODE = 'VW002';
                END IF;

                -- ── Guard: minimum length >= 6 ────────────────────────
                IF LENGTH(TRIM(p_new_password)) < 6 THEN
                    v_failure_reason := 'New password too short (' ||
                                        LENGTH(TRIM(p_new_password))::TEXT || ' chars)';
                    BEGIN
                        INSERT INTO password_change_audit (user_id, outcome, failure_reason)
                        VALUES (p_user_id, 'FAILED', v_failure_reason);
                    EXCEPTION WHEN OTHERS THEN
                        NULL;
                    END;
                    RAISE EXCEPTION 'New password must be at least 6 characters long'
                        USING ERRCODE = 'VW003';
                END IF;

                -- ── Guard: current password must be correct ───────────
                IF NOT p_current_pw_ok THEN
                    v_failure_reason := 'Current password mismatch';
                    BEGIN
                        INSERT INTO password_change_audit (user_id, outcome, failure_reason)
                        VALUES (p_user_id, 'FAILED', v_failure_reason);
                    EXCEPTION WHEN OTHERS THEN
                        NULL;
                    END;
                    RAISE EXCEPTION 'Current password is incorrect. Please try again'
                        USING ERRCODE = 'VW004';
                END IF;

                -- ── All checks passed — log SUCCESS ───────────────────
                BEGIN
                    INSERT INTO password_change_audit (user_id, outcome)
                    VALUES (p_user_id, 'SUCCESS');
                EXCEPTION WHEN OTHERS THEN
                    NULL;  -- non-fatal audit failure must never abort the operation
                END;

                RAISE NOTICE 'Password change validated for user %', p_user_id;

            EXCEPTION
                -- Re-raise our own custom errors as-is
                WHEN SQLSTATE 'VW001' THEN RAISE;
                WHEN SQLSTATE 'VW002' THEN RAISE;
                WHEN SQLSTATE 'VW003' THEN RAISE;
                WHEN SQLSTATE 'VW004' THEN RAISE;
                -- Catch any unexpected DB error and wrap it
                WHEN OTHERS THEN
                    BEGIN
                        INSERT INTO password_change_audit (user_id, outcome, failure_reason)
                        VALUES (p_user_id, 'FAILED', SQLERRM);
                    EXCEPTION WHEN OTHERS THEN
                        NULL;
                    END;
                    RAISE EXCEPTION 'An unexpected error occurred during password validation: %', SQLERRM
                        USING ERRCODE = 'VW099';
            END;
            $$
        `;

        logger.info('All 6 PL/pgSQL procedures/functions created successfully (incl. fn_validate_password_change)');

    } catch (error) {
        logger.error('Failed to initialize stored procedures:', error);
        throw error;
    }
}
