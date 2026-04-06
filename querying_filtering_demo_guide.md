# Querying & Filtering — Project Review Demo Guide

## 🎯 What to Demonstrate

You need to show a **full-stack server-side querying system** — and explain **how** dynamic SQL queries are built safely (parameterized, no SQL injection), **what** filters are supported (search, category, warranty status, price range, sort, pagination), and **how** the React frontend drives it all.

---

## 🏗️ Architecture Overview

```
Frontend (React)                    Backend (Express + PostgreSQL)
─────────────────                   ───────────────────────────────
Filter UI State                     Dynamic SQL Builder
  ↓                                    ↓
productApi.getAll(params)           WHERE "userId" = $1
  ↓                                  AND name ILIKE $2
URLSearchParams → GET /api/products    AND category = $3
  ?search=laptop                     AND "purchasePrice" >= $4
  &category=Computing                AND ws.status = $5
  &minPrice=500                    ORDER BY "purchasePrice" DESC
  &sortBy=purchasePrice            LIMIT $6 OFFSET $7
  &sortOrder=desc                      ↓
  &page=1&limit=12                 JSON Response + Pagination
```

---

## 📋 Step-by-Step Demo Flow

### Step 1: Show the Backend Query Builder

**File:** `backend/src/controllers/productController.ts`

### Step 2: Show the Frontend Filter UI

**File:** `warrantyvault-react/src/pages/Products/Products.tsx`

### Step 3: Demo Live Filtering on the UI

---

## 🔍 Backend: Dynamic Parameterized SQL Query Builder

**File:** `backend/src/controllers/productController.ts`

### Query Parameters Supported

| Parameter | Type | Example | SQL Clause |
|-----------|------|---------|-----------|
| `search` | string | `"laptop"` | `AND (name ILIKE $N OR brand ILIKE $N OR "serialNumber" ILIKE $N)` |
| `category` | string | `"Computing"` | `AND category = $N` |
| `warrantyStatus` | string | `"active"` | `LEFT JOIN warranty_status ws ... AND ws.status = $N` |
| `minPrice` | number | `500` | `AND "purchasePrice" >= $N` |
| `maxPrice` | number | `2000` | `AND "purchasePrice" <= $N` |
| `sortBy` | string | `"purchasePrice"` | `ORDER BY "purchasePrice"` |
| `sortOrder` | string | `"desc"` | `DESC` |
| `page` | number | `2` | `OFFSET` calculation |
| `limit` | number | `12` | `LIMIT $N` |

### The Complete Query Builder

```typescript
// ─── Allowed sort columns (whitelist to prevent SQL injection) ─────────
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
    name: 'name',
    purchasePrice: '"purchasePrice"',
    purchaseDate: '"purchaseDate"',
    warrantyExpiry: '"warrantyExpiry"',
    createdAt: '"createdAt"',
};

export const getProducts = asyncHandler(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    // ── Parse query params ──
    const {
        search, category, warrantyStatus,
        minPrice, maxPrice,
        sortBy = 'createdAt', sortOrder = 'desc',
        page = '1', limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '12', 10)));
    const offset = (pageNum - 1) * limitNum;

    // ── Validate sort column against whitelist ──
    const sortColumn = ALLOWED_SORT_COLUMNS[sortBy || 'createdAt'] || '"createdAt"';
    const sortDir = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // ── Build dynamic parameterized query ──
    let conditions = `WHERE p."userId" = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Search (ILIKE across 3 columns)
    if (search && search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        conditions += ` AND (p.name ILIKE $${paramIndex} 
                        OR p.brand ILIKE $${paramIndex} 
                        OR p."serialNumber" ILIKE $${paramIndex})`;
        params.push(searchPattern);
        paramIndex++;
    }

    // Category filter
    if (category && category.trim()) {
        conditions += ` AND p.category = $${paramIndex}`;
        params.push(category.trim());
        paramIndex++;
    }

    // Price range
    if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
            conditions += ` AND p."purchasePrice" >= $${paramIndex}`;
            params.push(min);
            paramIndex++;
        }
    }
    if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
            conditions += ` AND p."purchasePrice" <= $${paramIndex}`;
            params.push(max);
            paramIndex++;
        }
    }

    // Warranty status filter (requires JOIN)
    let joinClause = '';
    if (warrantyStatus && warrantyStatus.trim()) {
        joinClause = ` LEFT JOIN warranty_status ws ON ws.product_id = p.id`;
        conditions += ` AND ws.status = $${paramIndex}`;
        params.push(warrantyStatus.trim());
        paramIndex++;
    }

    // ── Count query (for pagination metadata) ──
    const countQuery = `SELECT COUNT(*) as total 
                        FROM products p${joinClause} ${conditions}`;
    const countResult = await sql.query(countQuery, params);
    const totalCount = parseInt(countResult[0]?.total || '0', 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    // ── Data query ──
    const dataQuery = `SELECT p.* FROM products p${joinClause} ${conditions} 
                       ORDER BY p.${sortColumn} ${sortDir} 
                       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const products = await sql.query(dataQuery, [...params, limitNum, offset]);

    res.json({
        success: true,
        data: products,
        pagination: { page: pageNum, limit: limitNum, totalCount, totalPages },
    });
});
```

**Key Points to Explain:**

### 1. Parameterized Queries (SQL Injection Prevention)
```sql
-- DANGEROUS (string concatenation):
WHERE name = '${userInput}'     -- SQL injection possible!

-- SAFE (parameterized with $N):
WHERE name = $1                 -- value is sanitized by the driver
```
> The `$1`, `$2`, `$3` placeholders are **parameterized** — the PostgreSQL driver handles escaping. User input **never** touches the SQL string directly.

### 2. Dynamic `paramIndex` Counter
```typescript
let paramIndex = 2;  // $1 is userId
// Each filter increments paramIndex:
// search → $2, category → $3, minPrice → $4, maxPrice → $5, etc.
```
> This allows any combination of filters. If the user only sets `search` and `minPrice`, the query becomes `WHERE "userId" = $1 AND name ILIKE $2 AND "purchasePrice" >= $3` — no gaps.

### 3. ILIKE Pattern Search
```sql
AND (p.name ILIKE $2 OR p.brand ILIKE $2 OR p."serialNumber" ILIKE $2)
```
> `ILIKE` = case-**i**nsensitive LIKE. Searches across **3 columns** with a single parameter. The `%` wildcards mean "contains anywhere."

### 4. SQL Injection Prevention via Sort Whitelist
```typescript
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
    name: 'name',
    purchasePrice: '"purchasePrice"',
    // ...
};
const sortColumn = ALLOWED_SORT_COLUMNS[sortBy] || '"createdAt"';
```
> `ORDER BY` cannot use `$N` parameters. Instead, we use a **whitelist** — the user can only sort by pre-approved column names. Any unknown value defaults to `createdAt`.

### 5. JOIN-Based Warranty Filtering
```sql
LEFT JOIN warranty_status ws ON ws.product_id = p.id
WHERE ws.status = $N
```
> The `warranty_status` table is auto-populated by our **PL/pgSQL trigger** (`trg_warranty_status_sync`). This filter queries the trigger's output table — showing how triggers and querying work together.

### 6. Two-Query Pagination Pattern
```sql
-- Query 1: Get total count (for "Showing 1-12 of 56")
SELECT COUNT(*) as total FROM products p WHERE ...

-- Query 2: Get the actual page of data
SELECT p.* FROM products p WHERE ... LIMIT 12 OFFSET 0
```
> Two separate queries — one for count, one for data. This gives the frontend both the results AND the total for pagination UI.

---

## 🔍 Backend: Categories Endpoint

```typescript
export const getCategories = asyncHandler(async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    const categories = await sql`
        SELECT DISTINCT category FROM products
        WHERE "userId" = ${userId} AND category != ''
        ORDER BY category ASC
    `;

    res.json({ success: true, data: categories.map(c => c.category) });
});
```

**Key Points:**
- `SELECT DISTINCT` → returns unique categories only
- Powers the category dropdown in the frontend filter panel

---

## 🔍 Frontend: Filter UI Components

**File:** `warrantyvault-react/src/pages/Products/Products.tsx`

### Filter State Management

```typescript
// ── Filter state ──
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');
const [category, setCategory] = useState('');
const [warrantyStatus, setWarrantyStatus] = useState('');
const [minPrice, setMinPrice] = useState('');
const [maxPrice, setMaxPrice] = useState('');
const [sortBy, setSortBy] = useState('createdAt');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

// ── Pagination state ──
const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 12, totalCount: 0, totalPages: 0,
});
```

### Debounced Search (300ms)

```typescript
useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(search);
        setPagination(prev => ({ ...prev, page: 1 }));  // reset to page 1
    }, 300);
    return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
}, [search]);
```

**Key Points:**
- **Debounce** → waits 300ms after the user stops typing before sending the API request
- **Prevents excessive API calls** — without debounce, every keystroke would trigger a query
- **Resets to page 1** — when search changes, we go back to the first page

### Data Fetching (Reactive to Filter Changes)

```typescript
const fetchProducts = useCallback(async () => {
    const params: ProductQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy, sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (warrantyStatus) params.warrantyStatus = warrantyStatus;
    if (minPrice) params.minPrice = parseFloat(minPrice);
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);

    const res = await productApi.getAll(params);
    setProducts(res.data);
    setPagination(res.pagination);
}, [debouncedSearch, category, warrantyStatus, minPrice, maxPrice,
    sortBy, sortOrder, pagination.page, pagination.limit]);

useEffect(() => { fetchProducts(); }, [fetchProducts]);
```

**Key Points:**
- **`useCallback` + dependency array** → re-creates the function only when a filter changes
- **`useEffect` watches `fetchProducts`** → automatically re-fetches when any filter value changes
- **Only includes non-empty params** — empty filters are excluded from the query string

### API Client (URL Building)

```typescript
// File: warrantyvault-react/src/api/productApi.ts
getAll: async (params?: ProductQueryParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                queryParams.set(key, String(value));
            }
        });
    }
    const queryString = queryParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    const res = await api.get<ProductListResponse>(url);
    return res.data;
},
```

**Key Points:**
- `URLSearchParams` → safely encodes query parameters (handles special characters)
- **Excludes empty values** — only sends non-null, non-empty parameters

---

## 🎨 Frontend Filter UI Elements

| UI Element | Filter | Implementation |
|-----------|--------|---------------|
| 🔍 Search bar | `search` | Text input with debounce (300ms) + clear button |
| 📂 Category dropdown | `category` | `<select>` populated from `GET /api/products/categories` |
| 🛡️ Warranty tabs | `warrantyStatus` | 4 tab buttons: All, Active, Expiring Soon, Expired |
| 💰 Price range | `minPrice` / `maxPrice` | Two `<input type="number">` fields |
| ↕️ Sort control | `sortBy` / `sortOrder` | `<select>` for column + toggle button for ASC/DESC |
| 📃 Pagination | `page` / `limit` | Page number buttons + prev/next arrows |
| ❌ Clear filters | — | "Clear All Filters" button resets all state |

---

## 🧪 Live API Demo (Terminal)

```bash
# 1. Get a token
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')

# 2. Basic listing (default: page 1, limit 12, sort by createdAt desc)
curl -s "http://localhost:5001/api/products" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20

# 3. Search by name (ILIKE)
curl -s "http://localhost:5001/api/products?search=macbook" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 4. Filter by category
curl -s "http://localhost:5001/api/products?category=Computing" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 5. Price range filter
curl -s "http://localhost:5001/api/products?minPrice=500&maxPrice=1500" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 6. Sort by price descending
curl -s "http://localhost:5001/api/products?sortBy=purchasePrice&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 7. Warranty status filter
curl -s "http://localhost:5001/api/products?warrantyStatus=active" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 8. Pagination (page 2, 5 per page)
curl -s "http://localhost:5001/api/products?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 9. Combined filters (search + category + sort + page)
curl -s "http://localhost:5001/api/products?search=pro&category=Computing&sortBy=purchasePrice&sortOrder=desc&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 10. Get categories for dropdown
curl -s "http://localhost:5001/api/products/categories" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 💬 Common Review Questions & Answers

### Q: "How do you prevent SQL injection?"
> **A:** Two techniques:
> 1. **Parameterized queries** — all user values use `$1`, `$2`, `$3` placeholders. The PostgreSQL driver handles escaping. Raw user input never appears in the SQL string.
> 2. **Sort column whitelist** — `ORDER BY` can't use `$N` params, so we map user input against a hardcoded `ALLOWED_SORT_COLUMNS` dictionary. Unknown values default to `"createdAt"`.

### Q: "What is `ILIKE` and why use it?"
> **A:** `ILIKE` is PostgreSQL's **case-insensitive LIKE** operator. `LIKE` is case-sensitive (e.g., "MacBook" wouldn't match "macbook"). `ILIKE` matches regardless of case, which is essential for search functionality.

### Q: "Why debounce the search input?"
> **A:** Without debouncing, every keystroke (e.g., typing "laptop" = 6 keystrokes = 6 API calls) would trigger a database query. Debouncing waits 300ms after the user stops typing, reducing it to **1 API call**.

### Q: "Why two separate queries for pagination?"
> **A:** The `COUNT(*)` query returns the total number of matching rows (for "Showing 1-12 of 56"). The `SELECT` query returns only the current page's data with `LIMIT + OFFSET`. Using `COUNT(*)` on the data query with `LIMIT` would only return the page size, not the total.

### Q: "What is `OFFSET` and how does it work?"
> **A:** `OFFSET` skips the first N rows. For page 3 with limit 12: `OFFSET = (3 - 1) * 12 = 24`. PostgreSQL skips the first 24 rows and returns the next 12.

### Q: "How does warranty status filtering work with the JOIN?"
> **A:** The `warranty_status` table is auto-populated by our `trg_warranty_status_sync` trigger whenever a product is inserted or updated. When filtering by warranty status, we `LEFT JOIN` on this table and add `AND ws.status = $N`. This shows **triggers and queries working together**.

### Q: "Why `Math.min(100, ...)` for limit?"
> **A:** This caps the maximum page size at 100 rows. Without it, a malicious client could send `limit=999999` and dump the entire table — a denial-of-service risk.

### Q: "Why is the sort column not parameterized?"
> **A:** PostgreSQL doesn't support parameters in `ORDER BY` clauses (`ORDER BY $1` doesn't work). The column name must be in the SQL string. We prevent injection by validating against a **whitelist** of approved column names.

---

## 📁 Files Involved

| File | Role |
|------|------|
| `controllers/productController.ts` | Dynamic SQL query builder with parameterized queries |
| `routes/productRoutes.ts` | Route definitions (`GET /`, `GET /categories`) |
| `pages/Products/Products.tsx` | Filter UI, debounced search, pagination controls |
| `api/productApi.ts` | API client with `URLSearchParams` builder |
| `middleware/authMiddleware.ts` | JWT auth guard (all product routes are protected) |

---

## ⏱ Suggested Demo Timing (5–7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00–0:30 | Draw/explain the Frontend → Backend → SQL flow |
| 0:30–2:00 | Open `productController.ts` — walk through the dynamic query builder (paramIndex, ILIKE, whitelist) |
| 2:00–2:30 | Explain SQL injection prevention — parameterized queries + sort whitelist |
| 2:30–3:00 | Explain the two-query pagination pattern (COUNT + SELECT) |
| 3:00–4:00 | Show `Products.tsx` — filter state, debounced search, useCallback |
| 4:00–4:30 | Show `productApi.ts` — URLSearchParams builder |
| 4:30–5:30 | Demo on the live UI — type a search, select category, change sort, paginate |
| 5:30–6:30 | Run 2-3 `curl` commands to show the raw API responses |
| 6:30–7:00 | Answer questions using Q&A above |
