# PL/pgSQL Triggers — Project Review Demo Guide

## 🎯 What to Demonstrate

You need to show **5 PL/pgSQL triggers** on the `products` table — and explain **when** each fires, **what** it does, and **why** it's useful.

---

## 📋 Step-by-Step Demo Flow

### Step 1: Start the Backend Server

```bash
cd backend && npm run dev
```

On startup, the console will show:
```
[INFO]: Trigger support tables created successfully
[INFO]: All PL/pgSQL trigger functions created successfully
[INFO]: All 5 PL/pgSQL triggers created successfully
```

> [!TIP]
> Triggers are created via `CREATE OR REPLACE` at server startup. They are **idempotent** — restarting doesn't duplicate them.

### Step 2: Show the Code

**File:** `backend/src/config/triggers.ts`

---

## 🔍 Trigger #1: Product Audit Log (`trg_product_audit`)

**Event:** `AFTER INSERT OR UPDATE OR DELETE` on `products`
**Purpose:** Logs every change to the `product_audit_log` table with full JSONB snapshots.

```sql
CREATE TRIGGER trg_product_audit
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_product_audit();
```

**Trigger Function:**
```sql
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
$$ LANGUAGE plpgsql;
```

**Key Points to Explain:**
- Uses `TG_OP` — PostgreSQL's built-in variable that tells the trigger which operation fired it
- Captures **full JSONB snapshots** of `OLD` and `NEW` rows for complete audit history
- `AFTER` trigger — runs after the operation succeeds, so we don't block the transaction
- `row_to_json()::jsonb` — converts the entire row to JSON for flexible querying

**Supporting Table:**
```sql
CREATE TABLE product_audit_log (
    log_id     SERIAL PRIMARY KEY,
    product_id INT,
    user_id    VARCHAR(255),
    action     VARCHAR(10) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    old_data   JSONB,                 -- NULL for INSERT
    new_data   JSONB,                 -- NULL for DELETE
    changed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Trigger #2: Auto-Update Timestamp (`trg_auto_update_timestamp`)

**Event:** `BEFORE UPDATE` on `products`
**Purpose:** Automatically sets `updatedAt = NOW()` whenever a row is modified.

```sql
CREATE TRIGGER trg_auto_update_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_auto_update_timestamp();
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION fn_auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points to Explain:**
- `BEFORE UPDATE` — runs **before** the row is written, so we can **modify** `NEW`
- No table needed — it modifies the incoming row itself
- Ensures the frontend always shows accurate "last modified" timestamps
- Eliminates the need for every UPDATE query to manually set the timestamp

---

## 🔍 Trigger #3: Warranty Status Sync (`trg_warranty_status_sync`)

**Event:** `AFTER INSERT OR UPDATE` on `products`
**Purpose:** Automatically computes warranty status (active / expired / expiring_soon) and upserts into `warranty_status` table.

```sql
CREATE TRIGGER trg_warranty_status_sync
AFTER INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_warranty_status_sync();
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION fn_warranty_status_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_status VARCHAR(50);
    v_days   INT;
    v_expiry DATE;
BEGIN
    -- Safe date parsing with error handling
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

    -- UPSERT: insert or update the warranty status
    INSERT INTO warranty_status (product_id, status, days_remaining, last_checked)
    VALUES (NEW.id, v_status, v_days, NOW())
    ON CONFLICT (product_id) DO UPDATE
    SET status = EXCLUDED.status,
        days_remaining = EXCLUDED.days_remaining,
        last_checked = EXCLUDED.last_checked;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points to Explain:**
- **DECLARE** block — shows PL/pgSQL variable declaration
- **Exception handling** — safe date parsing, won't crash on invalid strings
- **Business logic** — `< 0` days = expired, `≤ 30` days = expiring_soon, else = active
- **UPSERT** with `ON CONFLICT ... DO UPDATE` — handles both new and existing products

---

## 🔍 Trigger #4: Price Change Tracker (`trg_price_change_tracker`)

**Event:** `AFTER UPDATE` on `products`
**Purpose:** Records every price change into `price_change_history` table.

```sql
CREATE TRIGGER trg_price_change_tracker
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_price_change_tracker();
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION fn_price_change_tracker()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."purchasePrice" IS DISTINCT FROM NEW."purchasePrice" THEN
        INSERT INTO price_change_history (product_id, old_price, new_price)
        VALUES (NEW.id, OLD."purchasePrice", NEW."purchasePrice");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points to Explain:**
- `IS DISTINCT FROM` — NULL-safe comparison (unlike `<>`, which fails with NULLs)
- Only fires an INSERT when the price **actually changes**, not on every UPDATE
- Useful for price auditing, fraud detection, and analytics

---

## 🔍 Trigger #5: Prevent Negative Price (`trg_prevent_negative_price`)

**Event:** `BEFORE INSERT OR UPDATE` on `products`
**Purpose:** Validates that `purchasePrice` is never negative — acts as a database-level constraint.

```sql
CREATE TRIGGER trg_prevent_negative_price
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_negative_price();
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION fn_prevent_negative_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."purchasePrice" < 0 THEN
        RAISE EXCEPTION 'purchasePrice cannot be negative. Got: %', NEW."purchasePrice";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points to Explain:**
- `BEFORE` trigger — blocks the operation **before** it commits
- `RAISE EXCEPTION` — PostgreSQL's way of aborting a transaction with a custom error
- This is **defense-in-depth** — even if the API validation is bypassed, the DB rejects it
- `RETURN NEW` — if the check passes, allows the operation to proceed

---

## 🧪 Live API Demo (Terminal)

```bash
# 1. Get a token
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')

# 2. View audit logs (created by Trigger #1)
curl -s http://localhost:5001/api/triggers/audit-log \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30

# 3. View warranty statuses (auto-computed by Trigger #3)
curl -s http://localhost:5001/api/triggers/warranty-status \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30

# 4. View trigger activity summary
curl -s http://localhost:5001/api/triggers/summary \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. Test Trigger #5 — try to create a product with negative price (should fail!)
curl -s http://localhost:5001/api/procedures/register-product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","purchasePrice":-100}' | python3 -m json.tool
```

---

## 💬 Common Review Questions & Answers

### Q: "What is the difference between BEFORE and AFTER triggers?"
> - **`BEFORE`** triggers run **before** the row is written. They can **modify** the `NEW` row or **reject** the operation by raising an exception.
> - **`AFTER`** triggers run **after** the operation is committed. They are used for **side effects** like logging, syncing to other tables, etc. They cannot modify the row.

### Q: "What is `TG_OP`?"
> **A:** `TG_OP` is a **built-in PostgreSQL trigger variable** that contains the operation type as a string: `'INSERT'`, `'UPDATE'`, or `'DELETE'`. It lets a single trigger function handle multiple event types.

### Q: "What are `OLD` and `NEW`?"
> - **`NEW`** — the row data **after** the operation. Available in INSERT and UPDATE triggers.
> - **`OLD`** — the row data **before** the operation. Available in UPDATE and DELETE triggers.

### Q: "Why use triggers instead of handling this in application code?"
> **A:** Triggers provide **database-level guarantees** — they fire regardless of how the data is modified (API, manual SQL, another service). Application-level code can be bypassed. Triggers ensure **data integrity** at the source.

### Q: "What is `FOR EACH ROW`?"
> **A:** It means the trigger fires **once per row** affected. The alternative is `FOR EACH STATEMENT`, which fires once per SQL statement regardless of how many rows it affects.

### Q: "What is `RAISE EXCEPTION`?"
> **A:** It aborts the current transaction with a custom error message. The `%` is a placeholder that PostgreSQL replaces with the variable value, like `printf` in C.

### Q: "What is `ON CONFLICT ... DO UPDATE`?"
> **A:** This is PostgreSQL's **UPSERT** syntax. If a row with the same primary key already exists, it updates it instead of failing with a duplicate key error. We use it in the warranty status trigger to handle both new products and updated products.

---

## ⏱ Suggested Demo Timing (5–7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00–0:30 | Show server startup logs confirming triggers are created |
| 0:30–1:30 | Open `triggers.ts`, explain Trigger #1 (Audit Log) — `TG_OP`, `OLD`/`NEW`, `JSONB` |
| 1:30–2:30 | Explain Trigger #2 (Auto Timestamp) — BEFORE vs AFTER |
| 2:30–3:30 | Explain Trigger #3 (Warranty Sync) — DECLARE, Exception handling, UPSERT |
| 3:30–4:30 | Explain Trigger #4 (Price Tracker) — `IS DISTINCT FROM`, conditional insert |
| 4:30–5:00 | Explain Trigger #5 (Prevent Negative) — RAISE EXCEPTION, defense-in-depth |
| 5:00–6:00 | Run `curl` commands to show audit logs and warranty statuses |
| 6:00–7:00 | Answer reviewer questions using the Q&A section above |
