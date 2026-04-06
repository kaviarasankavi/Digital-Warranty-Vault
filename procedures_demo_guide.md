# PL/pgSQL Stored Procedures — Project Review Demo Guide

## 🎯 What to Demonstrate

You need to show **5 PL/pgSQL stored procedures** — and explain the **business logic** each encapsulates, **how** they use PL/pgSQL features (variables, loops, exception handling, RETURNS TABLE), and **why** procedures are better than raw SQL for these tasks.

---

## 📋 Step-by-Step Demo Flow

### Step 1: Start the Backend Server

```bash
cd backend && npm run dev
```

On startup, the console will show:
```
[INFO]: Procedure support tables created successfully
[INFO]: All 5 PL/pgSQL stored procedures created successfully
```

### Step 2: Show the Code

**File:** `backend/src/config/procedures.ts`

---

## 🔍 Procedure #1: `sp_register_product`

**Type:** PROCEDURE (no return value)
**Purpose:** Atomic product registration with validation — inserts a product in a single transaction.

```sql
CREATE OR REPLACE PROCEDURE sp_register_product(
    p_user_id        VARCHAR,
    p_name           VARCHAR,
    p_brand          VARCHAR DEFAULT '',
    p_model          VARCHAR DEFAULT '',
    p_serial_number  VARCHAR DEFAULT '',
    p_category       VARCHAR DEFAULT '',
    p_purchase_date  VARCHAR DEFAULT '',
    p_purchase_price NUMERIC DEFAULT 0,
    p_warranty_expiry VARCHAR DEFAULT '',
    p_notes          TEXT DEFAULT ''
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

    -- Insert the product (triggers handle audit + warranty status)
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

    RAISE NOTICE 'Product registered with ID: %', v_product_id;
END;
$$;
```

**How it's called from Node.js:**
```typescript
await sql`CALL sp_register_product(
    ${userId}, ${name}, ${brand}, ${model}, ${serialNumber},
    ${category}, ${purchaseDate}, ${purchasePrice},
    ${warrantyExpiry}, ${notes}
)`;
```

**Key Points to Explain:**
- **DECLARE** → declares a local variable `v_product_id` to capture the new ID
- **Validation** → `RAISE EXCEPTION` aborts the transaction if name is empty or price is negative
- **DEFAULT parameters** → optional fields don't need to be passed
- **RETURNING INTO** → captures the auto-generated `id` into a variable
- **Integration with triggers** → the INSERT automatically fires `trg_product_audit` and `trg_warranty_status_sync`

---

## 🔍 Procedure #2: `sp_transfer_ownership`

**Type:** PROCEDURE
**Purpose:** Transfers a product from one user to another with validation and audit logging.

```sql
CREATE OR REPLACE PROCEDURE sp_transfer_ownership(
    p_product_id   INT,
    p_from_user_id VARCHAR,
    p_to_user_id   VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_name  VARCHAR;
    v_current_owner VARCHAR;
BEGIN
    -- Validate: can't transfer to yourself
    IF p_from_user_id = p_to_user_id THEN
        RAISE EXCEPTION 'Cannot transfer product to the same user';
    END IF;

    -- Verify product exists and belongs to the sender
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
    SET "userId" = p_to_user_id, "updatedAt" = NOW()
    WHERE id = p_product_id;

    -- Log the transfer event
    INSERT INTO ownership_transfer_log (product_id, from_user_id, to_user_id, product_name)
    VALUES (p_product_id, p_from_user_id, p_to_user_id, v_product_name);
END;
$$;
```

**Key Points to Explain:**
- **Multi-step validation** → 3 checks before the actual transfer (self-transfer, existence, ownership)
- **SELECT INTO** → loads query results into local variables
- **Audit trail** → logs to `ownership_transfer_log` table for compliance
- **Atomic** → if any step fails, the entire transaction rolls back

**Supporting Table:**
```sql
CREATE TABLE ownership_transfer_log (
    transfer_id   SERIAL PRIMARY KEY,
    product_id    INT NOT NULL,
    from_user_id  VARCHAR(255),
    to_user_id    VARCHAR(255),
    product_name  VARCHAR(255),
    transferred_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Procedure #3: `sp_bulk_update_warranty_status`

**Type:** PROCEDURE
**Purpose:** Loops through all products of a user and recalculates warranty status in batch.

```sql
CREATE OR REPLACE PROCEDURE sp_bulk_update_warranty_status(
    p_user_id VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rec    RECORD;
    v_status VARCHAR(50);
    v_days   INT;
    v_expiry DATE;
    v_count  INT := 0;
BEGIN
    FOR v_rec IN
        SELECT id, "warrantyExpiry"
        FROM products
        WHERE "userId" = p_user_id
    LOOP
        -- Safe date parsing
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

        -- UPSERT warranty status
        INSERT INTO warranty_status (product_id, status, days_remaining, last_checked)
        VALUES (v_rec.id, v_status, v_days, NOW())
        ON CONFLICT (product_id) DO UPDATE
        SET status = EXCLUDED.status,
            days_remaining = EXCLUDED.days_remaining,
            last_checked = EXCLUDED.last_checked;

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Updated warranty status for % products', v_count;
END;
$$;
```

**Key Points to Explain:**
- **FOR ... IN ... LOOP** → iterates over a query result set row-by-row
- **RECORD type** → `v_rec` is a generic record that holds each row from the cursor
- **Exception handling** → safely handles unparseable date strings without crashing
- **Counter variable** → `v_count` tracks how many products were processed
- **Use case** → daily batch job to recalculate all warranty statuses (dates change daily!)

---

## 🔍 Procedure #4: `sp_purge_expired_products`

**Type:** PROCEDURE
**Purpose:** Archives products whose warranty expired more than N days ago, then deletes them.

```sql
CREATE OR REPLACE PROCEDURE sp_purge_expired_products(
    p_user_id         VARCHAR,
    p_days_past_expiry INT DEFAULT 365
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rec      RECORD;
    v_expiry   DATE;
    v_archived INT := 0;
BEGIN
    FOR v_rec IN
        SELECT * FROM products
        WHERE "userId" = p_user_id AND "warrantyExpiry" <> ''
    LOOP
        BEGIN
            v_expiry := v_rec."warrantyExpiry"::DATE;
        EXCEPTION WHEN OTHERS THEN
            CONTINUE;  -- skip unparseable dates
        END;

        IF v_expiry IS NOT NULL AND (CURRENT_DATE - v_expiry) > p_days_past_expiry THEN
            -- Step 1: Archive the product
            INSERT INTO products_archive (
                original_id, "userId", name, brand, model,
                "serialNumber", category, "purchaseDate",
                "purchasePrice", "warrantyExpiry", notes, "originalCreatedAt"
            ) VALUES (
                v_rec.id, v_rec."userId", v_rec.name, v_rec.brand, v_rec.model,
                v_rec."serialNumber", v_rec.category, v_rec."purchaseDate",
                v_rec."purchasePrice", v_rec."warrantyExpiry", v_rec.notes, v_rec."createdAt"
            );

            -- Step 2: Delete (triggers log this as DELETE in audit log)
            DELETE FROM products WHERE id = v_rec.id;

            v_archived := v_archived + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Archived and purged % expired products', v_archived;
END;
$$;
```

**Key Points to Explain:**
- **Archive-then-delete** pattern — data is never truly lost, just moved
- **`CONTINUE`** — PL/pgSQL loop control, skips the current iteration
- **Configurable threshold** — `p_days_past_expiry DEFAULT 365` can be overridden
- **Trigger integration** — the DELETE fires `trg_product_audit`, creating an automatic audit entry

**Supporting Table:**
```sql
CREATE TABLE products_archive (
    archive_id        SERIAL PRIMARY KEY,
    original_id       INT,
    "userId"          VARCHAR(255),
    name              VARCHAR(255),
    -- ... all original columns ...
    "originalCreatedAt" TIMESTAMP,
    archived_at       TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Procedure #5: `sp_generate_product_report` (FUNCTION)

**Type:** FUNCTION with `RETURNS TABLE`
**Purpose:** Returns aggregated statistics — category counts, warranty breakdown, totals, averages.

```sql
CREATE OR REPLACE FUNCTION sp_generate_product_report(
    p_user_id VARCHAR
)
RETURNS TABLE (
    report_type VARCHAR,
    label       VARCHAR,
    value       NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Product count by category
    RETURN QUERY
    SELECT 'category_count'::VARCHAR, 
           COALESCE(NULLIF(p.category, ''), 'Uncategorized')::VARCHAR,
           COUNT(*)::NUMERIC
    FROM products p WHERE p."userId" = p_user_id
    GROUP BY p.category;

    -- 2. Warranty status breakdown
    RETURN QUERY
    SELECT 'warranty_status'::VARCHAR, ws.status::VARCHAR, COUNT(*)::NUMERIC
    FROM warranty_status ws JOIN products p ON ws.product_id = p.id
    WHERE p."userId" = p_user_id
    GROUP BY ws.status;

    -- 3. Total purchase value
    RETURN QUERY
    SELECT 'total_value'::VARCHAR, 'total_purchase_value'::VARCHAR,
           COALESCE(SUM(p."purchasePrice"), 0)::NUMERIC
    FROM products p WHERE p."userId" = p_user_id;

    -- 4. Total product count
    RETURN QUERY
    SELECT 'total_count'::VARCHAR, 'total_products'::VARCHAR,
           COUNT(*)::NUMERIC
    FROM products p WHERE p."userId" = p_user_id;

    -- 5. Average product price
    RETURN QUERY
    SELECT 'average'::VARCHAR, 'average_price'::VARCHAR,
           COALESCE(AVG(p."purchasePrice"), 0)::NUMERIC
    FROM products p WHERE p."userId" = p_user_id;

    -- 6. Archived products count
    RETURN QUERY
    SELECT 'archived'::VARCHAR, 'archived_products'::VARCHAR,
           COUNT(*)::NUMERIC
    FROM products_archive pa WHERE pa."userId" = p_user_id;
END;
$$;
```

**Key Points to Explain:**
- **FUNCTION vs PROCEDURE** → Functions can RETURN data; Procedures cannot
- **`RETURNS TABLE`** → defines a custom result schema the function returns
- **`RETURN QUERY`** → appends rows to the result set without ending the function
- **Multiple RETURN QUERYs** → generates a unified report from multiple tables in one call
- **`COALESCE` + `NULLIF`** → handles empty strings as 'Uncategorized'

**How it's called:**
```sql
SELECT * FROM sp_generate_product_report('user123');
```

---

## 🧪 Live API Demo (Terminal)

```bash
# 1. Get a token
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')

# 2. Register a product via stored procedure
curl -s http://localhost:5001/api/procedures/register-product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Laptop","brand":"Dell","category":"Computing","purchasePrice":1299,"warrantyExpiry":"2027-06-01"}' \
  | python3 -m json.tool

# 3. Bulk update warranty statuses
curl -s -X POST http://localhost:5001/api/procedures/bulk-update-warranty \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30

# 4. Generate product report
curl -s http://localhost:5001/api/procedures/product-report \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. Purge expired products (archive + delete)
curl -s -X POST http://localhost:5001/api/procedures/purge-expired \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysPastExpiry": 365}' | python3 -m json.tool

# 6. Test validation — should fail with exception
curl -s http://localhost:5001/api/procedures/register-product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"","purchasePrice":500}' | python3 -m json.tool
```

---

## 💬 Common Review Questions & Answers

### Q: "What is the difference between a PROCEDURE and a FUNCTION?"
> - **PROCEDURE** (created with `CREATE PROCEDURE`, called with `CALL`) → performs actions, **cannot return data**, supports transactions (`COMMIT`/`ROLLBACK` inside).
> - **FUNCTION** (created with `CREATE FUNCTION`, called with `SELECT`) → **returns data** via `RETURNS TABLE` or `RETURNS type`, cannot manage transactions internally.

### Q: "What is `DECLARE`?"
> **A:** The `DECLARE` block is where you declare **local variables** in PL/pgSQL. Variables have a name, type, and optional default value. Example: `v_count INT := 0;`

### Q: "What is `RAISE EXCEPTION` vs `RAISE NOTICE`?"
> - **`RAISE EXCEPTION`** → aborts the transaction, rolls back all changes, returns error to caller
> - **`RAISE NOTICE`** → logs an informational message (like `console.log`), does NOT abort

### Q: "What is `FOR ... IN ... LOOP`?"
> **A:** PL/pgSQL's cursor loop. It executes a query and iterates over each row, storing it in a `RECORD` variable. Similar to a `forEach` in JavaScript.

### Q: "What is `SELECT INTO` vs `RETURN QUERY`?"
> - **`SELECT INTO v_name`** → stores a single query result into a local variable
> - **`RETURN QUERY`** → appends query results to the function's return set (used in `RETURNS TABLE` functions)

### Q: "Why use stored procedures instead of writing SQL in Node.js?"
> **A:** Three main reasons:
> 1. **Atomicity** — the entire procedure runs in one transaction; if any step fails, everything rolls back
> 2. **Reusability** — call the same procedure from any client (API, admin scripts, other services)
> 3. **Performance** — the execution plan is cached on the database server, reducing overhead
> 4. **Security** — you can grant EXECUTE permission on the procedure without giving direct table access

### Q: "How do procedures interact with triggers?"
> **A:** When a procedure INSERTs, UPDATEs, or DELETEs from the `products` table, all triggers fire automatically. For example, `sp_register_product` INSERT fires `trg_product_audit` (audit log) and `trg_warranty_status_sync` (warranty computation). This shows **layered automation**.

---

## ⏱ Suggested Demo Timing (5–7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00–0:30 | Show server logs confirming procedures are created |
| 0:30–1:30 | Open `procedures.ts`, walk through Procedure #1 (Register) — DECLARE, validation, RETURNING INTO |
| 1:30–2:30 | Explain Procedure #2 (Transfer) — SELECT INTO, multi-step validation, audit log |
| 2:30–3:30 | Explain Procedure #3 (Bulk Update) — FOR...LOOP, RECORD, exception handling |
| 3:30–4:30 | Explain Procedure #4 (Purge) — archive-then-delete, CONTINUE |
| 4:30–5:30 | Explain Procedure #5 (Report) — FUNCTION vs PROCEDURE, RETURNS TABLE, RETURN QUERY |
| 5:30–6:30 | Run API calls to demo register-product and product-report |
| 6:30–7:00 | Answer reviewer questions using the Q&A section above |
