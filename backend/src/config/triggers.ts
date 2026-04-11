import { logger } from '../utils/logger';

/**
 * Initialize all PostgreSQL PL/pgSQL triggers and supporting tables.
 * Called once at server startup after the products table is created.
 */
export async function initTriggers(sql: any): Promise<void> {
    try {
        // ============================================================
        // TABLE 1: product_audit_log — stores audit trail for all changes
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS product_audit_log (
                log_id SERIAL PRIMARY KEY,
                product_id INT,
                user_id VARCHAR(255),
                action VARCHAR(10) NOT NULL,
                old_data JSONB,
                new_data JSONB,
                changed_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // ============================================================
        // TABLE 2: warranty_status — auto-computed warranty status
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS warranty_status (
                product_id INT PRIMARY KEY,
                status VARCHAR(50) DEFAULT 'no_warranty',
                days_remaining INT DEFAULT 0,
                last_checked TIMESTAMP DEFAULT NOW()
            )
        `;

        // ============================================================
        // TABLE 3: price_change_history — tracks purchasePrice changes
        // ============================================================
        await sql`
            CREATE TABLE IF NOT EXISTS price_change_history (
                change_id SERIAL PRIMARY KEY,
                product_id INT NOT NULL,
                old_price NUMERIC(10, 2),
                new_price NUMERIC(10, 2),
                changed_at TIMESTAMP DEFAULT NOW()
            )
        `;

        logger.info('Trigger support tables created successfully');

        // ============================================================
        // TRIGGER FUNCTION 1: Audit Log
        // Logs every INSERT, UPDATE, DELETE on the products table
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_product_audit()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    INSERT INTO product_audit_log (product_id, user_id, action, old_data, new_data)
                    VALUES (NEW.id, NEW."userId", 'INSERT', NULL, row_to_json(NEW)::jsonb);
                    RETURN NEW;
                ELSIF TG_OP = 'UPDATE' THEN
                    INSERT INTO product_audit_log (product_id, user_id, action, old_data, new_data)
                    VALUES (NEW.id, NEW."userId", 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
                    RETURN NEW;
                ELSIF TG_OP = 'DELETE' THEN
                    INSERT INTO product_audit_log (product_id, user_id, action, old_data, new_data)
                    VALUES (OLD.id, OLD."userId", 'DELETE', row_to_json(OLD)::jsonb, NULL);
                    RETURN OLD;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // TRIGGER FUNCTION 2: Auto-update timestamp
        // Sets "updatedAt" to NOW() on every UPDATE
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_auto_update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."updatedAt" = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // TRIGGER FUNCTION 3: Warranty Status Sync
        // Computes warranty status and upserts into warranty_status
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_warranty_status_sync()
            RETURNS TRIGGER AS $$
            DECLARE
                v_status VARCHAR(50);
                v_days INT;
                v_expiry DATE;
            BEGIN
                -- Try to parse warrantyExpiry as a date
                BEGIN
                    v_expiry := NEW."warrantyExpiry"::DATE;
                EXCEPTION WHEN OTHERS THEN
                    v_expiry := NULL;
                END;

                IF v_expiry IS NULL OR NEW."warrantyExpiry" = '' THEN
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
                VALUES (NEW.id, v_status, v_days, NOW())
                ON CONFLICT (product_id) DO UPDATE
                SET status = EXCLUDED.status,
                    days_remaining = EXCLUDED.days_remaining,
                    last_checked = EXCLUDED.last_checked;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // TRIGGER FUNCTION 4: Price Change Tracker
        // Records price changes when purchasePrice differs
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_price_change_tracker()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD."purchasePrice" IS DISTINCT FROM NEW."purchasePrice" THEN
                    INSERT INTO price_change_history (product_id, old_price, new_price)
                    VALUES (NEW.id, OLD."purchasePrice", NEW."purchasePrice");
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // TRIGGER FUNCTION 5: Prevent Negative Price
        // Raises an exception if purchasePrice < 0
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_prevent_negative_price()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW."purchasePrice" < 0 THEN
                    RAISE EXCEPTION 'purchasePrice cannot be negative. Got: %', NEW."purchasePrice";
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        logger.info('All PL/pgSQL trigger functions created successfully');

        // ============================================================
        // TRIGGER FUNCTION 6: Validate Warranty Dates
        // Raises an exception if warrantyExpiry < purchaseDate
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_validate_warranty_dates()
            RETURNS TRIGGER AS $$
            DECLARE
                v_purchase DATE;
                v_expiry DATE;
            BEGIN
                IF NEW."purchaseDate" IS NOT NULL AND TRIM(NEW."purchaseDate") <> '' AND NEW."warrantyExpiry" IS NOT NULL AND TRIM(NEW."warrantyExpiry") <> '' THEN
                    BEGIN
                        v_purchase := NEW."purchaseDate"::DATE;
                        v_expiry := NEW."warrantyExpiry"::DATE;
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore parse errors
                    END;
                    
                    IF v_purchase IS NOT NULL AND v_expiry IS NOT NULL AND v_expiry < v_purchase THEN
                        RAISE EXCEPTION 'Warranty expiry date cannot be before the purchase date.';
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // TRIGGER FUNCTION 7: Prevent Duplicate Serial
        // Raises an exception if a non-empty serialNumber is duplicated for the same user
        // ============================================================
        await sql`
            CREATE OR REPLACE FUNCTION fn_prevent_duplicate_serial()
            RETURNS TRIGGER AS $$
            DECLARE
                v_count INT;
            BEGIN
                IF NEW."serialNumber" IS NOT NULL AND TRIM(NEW."serialNumber") <> '' THEN
                    -- Check if another product belonging to the same user has exactly the same serialNumber
                    SELECT COUNT(*) INTO v_count
                    FROM products
                    WHERE "userId" = NEW."userId"
                      AND "serialNumber" = TRIM(NEW."serialNumber")
                      AND id IS DISTINCT FROM NEW.id;
                      
                    IF v_count > 0 THEN
                        RAISE EXCEPTION 'A product with serial number "%" already exists in your vault.', TRIM(NEW."serialNumber");
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `;

        // ============================================================
        // DROP EXISTING TRIGGERS (to avoid duplicates on restart)
        // ============================================================
        await sql`DROP TRIGGER IF EXISTS trg_product_audit ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_auto_update_timestamp ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_warranty_status_sync ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_price_change_tracker ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_prevent_negative_price ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_validate_warranty_dates ON products`;
        await sql`DROP TRIGGER IF EXISTS trg_prevent_duplicate_serial ON products`;

        // ============================================================
        // CREATE TRIGGERS
        // ============================================================

        // Trigger 1: Audit log (AFTER INSERT, UPDATE, DELETE)
        await sql`
            CREATE TRIGGER trg_product_audit
            AFTER INSERT OR UPDATE OR DELETE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_product_audit()
        `;

        // Trigger 2: Auto-update timestamp (BEFORE UPDATE)
        await sql`
            CREATE TRIGGER trg_auto_update_timestamp
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_auto_update_timestamp()
        `;

        // Trigger 3: Warranty status sync (AFTER INSERT or UPDATE)
        await sql`
            CREATE TRIGGER trg_warranty_status_sync
            AFTER INSERT OR UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_warranty_status_sync()
        `;

        // Trigger 4: Price change tracker (AFTER UPDATE)
        await sql`
            CREATE TRIGGER trg_price_change_tracker
            AFTER UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_price_change_tracker()
        `;

        // Trigger 5: Prevent negative price (BEFORE INSERT or UPDATE)
        await sql`
            CREATE TRIGGER trg_prevent_negative_price
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_prevent_negative_price()
        `;

        // Trigger 6: Validate warranty dates (BEFORE INSERT or UPDATE)
        await sql`
            CREATE TRIGGER trg_validate_warranty_dates
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_validate_warranty_dates()
        `;

        // Trigger 7: Prevent duplicate serial (BEFORE INSERT or UPDATE)
        await sql`
            CREATE TRIGGER trg_prevent_duplicate_serial
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION fn_prevent_duplicate_serial()
        `;

        logger.info('All 7 PL/pgSQL triggers created successfully');

    } catch (error) {
        logger.error('Failed to initialize triggers:', error);
        throw error;
    }
}
