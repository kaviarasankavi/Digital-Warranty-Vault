# MongoDB Aggregation Pipeline — Project Review Demo Guide

## 🎯 What to Demonstrate

You need to show **3 pipeline stages**: `$match`, `$group`, `$project` — and explain **why** each stage is needed and **what** it does.

---

## 📋 Step-by-Step Demo Flow

### Step 1: Start Both Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend (needs Node 20+)
cd warrantyvault-react && PATH="/opt/homebrew/bin:$PATH" npm run dev
```

### Step 2: Login & Navigate

1. Open **http://localhost:5173**
2. Login with any account (or register a new one)
3. Click **"Analytics"** in the sidebar

> [!TIP]
> The first time any user visits Analytics, the system automatically seeds 50 sample products and 50 warranties into MongoDB for that user.

### Step 3: Walk Through Each Pipeline (Code + UI)

---

## 🔍 Pipeline #1: Category Summary

**File:** `backend/src/controllers/analyticsController.ts` → `getCategorySummary()`

**Show the code and explain each stage:**

```javascript
// STAGE 1: $match — Filters documents before processing
// WHY: We only want THIS user's products, not all products in the collection
{
    $match: {
        userId: userId,   // Filters at the DB level, uses index
    }
}

// STAGE 2: $group — Aggregates filtered documents into groups
// WHY: We want to know how many products per category and total spending
{
    $group: {
        _id: '$category',                        // Group key
        productCount: { $sum: 1 },               // Count per group
        totalSpend:   { $sum: '$purchasePrice' }, // Sum of prices
        avgPrice:     { $avg: '$purchasePrice' }, // Average price
        minPrice:     { $min: '$purchasePrice' }, // Min price
        maxPrice:     { $max: '$purchasePrice' }, // Max price
    }
}

// STAGE 3: $project — Reshapes the output, renames fields, computes new fields
// WHY: The raw output has _id as the category name — we want clean, API-ready JSON
{
    $project: {
        _id: 0,                                    // Hide MongoDB's _id
        category: '$_id',                          // Rename _id → category
        productCount: 1,                           // Include as-is
        totalSpend: { $round: ['$totalSpend', 2] },// Round to 2 decimals
        formattedTotal: {                          // Compute a new field
            $concat: [{ $literal: '$' }, { $toString: { $round: ['$totalSpend', 2] } }]
        }
    }
}
```

**Show on UI:** Point to the **Category Distribution** horizontal bar chart — 10 categories with percentages.

---

## 🔍 Pipeline #2: Warranty Status

**File:** `analyticsController.ts` → `getWarrantyStatus()`

**Key points to explain:**

```javascript
// $match — Filter by user + optional warranty type filter
{ $match: { userId, ...(req.query.warrantyType ? { warrantyType } : {}) } }

// $group — Count warranties per status (active/expired/expiring)
{ $group: { _id: '$status', count: { $sum: 1 }, totalClaims: { $sum: '$claimCount' } } }

// $project — Uses $switch to assign readable labels and colors
{
    $project: {
        label: {
            $switch: {
                branches: [
                    { case: { $eq: ['$_id', 'active'] },  then: 'Active Warranties' },
                    { case: { $eq: ['$_id', 'expired'] }, then: 'Expired Warranties' },
                    { case: { $eq: ['$_id', 'expiring'] },then: 'Expiring Soon' },
                ],
                default: 'Unknown'
            }
        },
        color: {   // Assign chart colors directly in the pipeline
            $switch: { /* green for active, red for expired, amber for expiring */ }
        }
    }
}
```

**Show on UI:** Point to the **Donut Chart** — 82% Active (green), 18% Expired (red).

---

## 🔍 Pipeline #3: Monthly Spending

**Key talking point:** This pipeline demonstrates **date-based grouping**.

```javascript
// $match — Filter by user AND date range (last 12 months)
{ $match: { userId, purchaseDate: { $gte: startDate } } }

// $group — Group by YEAR + MONTH extracted from the date field
{
    $group: {
        _id: {
            year:  { $year: '$purchaseDate' },   // Extract year
            month: { $month: '$purchaseDate' },  // Extract month
        },
        totalSpend: { $sum: '$purchasePrice' },
        categories: { $addToSet: '$category' },  // Unique categories per month
    }
}

// $project — Format the month label using $let and $arrayElemAt
{
    $project: {
        label: {
            $let: {
                vars: { monthNames: ['','Jan','Feb','Mar',...,'Dec'] },
                in: { $concat: [
                    { $arrayElemAt: ['$$monthNames', '$_id.month'] },
                    ' ',
                    { $toString: '$_id.year' }
                ]}
            }
        },
        categoryCount: { $size: '$categories' }  // Count unique categories
    }
}
```

**Show on UI:** Point to the **Monthly Spending bar chart** — APR through FEB with varying heights.

---

## 🔍 Pipeline #4: Brand Analytics

**Key talking point:** `$addToSet` for unique values, `$max`/`$min` for date ranges.

```javascript
// $match — Exclude products with empty brand names
{ $match: { userId, brand: { $ne: '' } } }

// $group — Rich aggregation per brand
{
    $group: {
        _id: '$brand',
        productCount:   { $sum: 1 },
        totalValue:     { $sum: '$purchasePrice' },
        categories:     { $addToSet: '$category' },    // Unique categories
        latestPurchase: { $max: '$purchaseDate' },     // Most recent purchase
    }
}

// $project — Compute category count and formatted currency
{
    $project: {
        brand: '$_id',
        categoryCount: { $size: '$categories' },       // Count unique categories
        formattedValue: {
            $concat: [{ $literal: '$' }, { $toString: { $round: ['$totalValue', 2] } }]
        }
    }
}
```

**Show on UI:** Point to **Brand Insights** — Apple #1 ($6,433), Samsung #2 ($5,430).

---

## 🔍 Pipeline #5: Price Distribution

**Key talking point:** Using `$switch` inside `$group._id` to create **price buckets** (histogram).

```javascript
// $match — Only products with price > 0
{ $match: { userId, purchasePrice: { $gt: 0 } } }

// $group — $switch creates price range buckets dynamically
{
    $group: {
        _id: {
            $switch: {
                branches: [
                    { case: { $lte: ['$purchasePrice', 100] },  then: '0-100' },
                    { case: { $lte: ['$purchasePrice', 300] },  then: '100-300' },
                    { case: { $lte: ['$purchasePrice', 500] },  then: '300-500' },
                    { case: { $lte: ['$purchasePrice', 1000] }, then: '500-1000' },
                    { case: { $lte: ['$purchasePrice', 2000] }, then: '1000-2000' },
                    { case: { $lte: ['$purchasePrice', 3000] }, then: '2000-3000' },
                ],
                default: '3000+'
            }
        },
        count: { $sum: 1 },
        products: { $push: '$name' },  // Collect product names
    }
}

// $project — Sort order key + sample products
{
    $project: {
        range: '$_id',
        sampleProducts: { $slice: ['$products', 3] },  // Show first 3 products
        sortOrder: { $switch: { /* numeric sort key */ } }
    }
}
```

**Show on UI:** Point to **Price Distribution** histogram — $500-1000 range has the most products.

---

## 🧪 Live API Demo (Terminal)

If the reviewer wants to see raw API output, run these in terminal:

```bash
# 1. Login to get a token
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')

# 2. Call any analytics endpoint
curl -s http://localhost:5001/api/analytics/category-summary \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:5001/api/analytics/warranty-status \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:5001/api/analytics/monthly-spending \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:5001/api/analytics/brand-analytics \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:5001/api/analytics/price-distribution \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Each response includes `"pipeline": "$match → $group → $project"` confirming the stages.

---

## 💬 Common Review Questions & Answers

### Q: "Why use aggregation pipelines instead of fetching data and processing in Node.js?"
> **A:** Aggregation pipelines run **inside MongoDB's query engine**, so the database does the heavy lifting. This is far more efficient than fetching all documents to Node.js and processing them in-memory — especially with large datasets. It reduces network transfer and leverages MongoDB's optimized C++ aggregation engine.

### Q: "What does each stage do?"
> - **`$match`** → Filters documents early (like SQL's `WHERE`). Uses indexes for performance.
> - **`$group`** → Aggregates data (like SQL's `GROUP BY`). Computes `$sum`, `$avg`, `$min`, `$max`, `$addToSet`, etc.
> - **`$project`** → Reshapes the output (like SQL's `SELECT`). Renames fields, computes new fields, hides internal fields.

### Q: "Why is $match placed first?"
> **A:** Placing `$match` first reduces the number of documents that flow through subsequent stages. MongoDB can use indexes during `$match`, making it the most performance-critical stage. This is called **"pipeline optimization"**.

### Q: "What is `$literal` used for?"
> **A:** In MongoDB, strings starting with `$` are interpreted as field references. When we want the literal dollar sign character `$` (for currency formatting), we wrap it in `{ $literal: '$' }` to tell MongoDB it's a string, not a field path.

### Q: "What is `$addToSet` vs `$push`?"
> **A:** `$push` adds every value (allows duplicates). `$addToSet` only adds unique values. We use `$addToSet` when collecting unique categories per brand, and `$push` for collecting all product names.

### Q: "How are indexes helping here?"
> **A:** We created compound indexes like `{ userId: 1, category: 1 }` and `{ userId: 1, purchaseDate: 1 }`. When `$match` filters by `userId`, MongoDB uses these indexes to quickly locate matching documents instead of scanning the entire collection.

---

## 📊 Architecture Summary (for verbal explanation)

```
User (Browser)
    ↓ clicks "Analytics"
React Frontend (Analytics.tsx)
    ↓ fetches /api/analytics/*
Express Backend (analyticsController.ts)
    ↓ runs aggregation pipeline
MongoDB Atlas
    ↓ $match → $group → $project
    ↓ returns aggregated results
Express Backend
    ↓ enriches with percentages/rankings
React Frontend
    ↓ renders charts (bar, donut, histogram)
User sees analytics dashboard
```

---

## ⏱ Suggested Demo Timing (5-7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00–0:30 | Open Analytics page, show all 5 charts loaded with real data |
| 0:30–2:00 | Open `analyticsController.ts`, walk through Pipeline #1 (Category Summary) — explain each stage |
| 2:00–3:00 | Show Pipeline #2 (Warranty Status) — highlight `$switch` in `$project` |
| 3:00–4:00 | Show Pipeline #3 (Monthly Spending) — highlight date extraction in `$group` |
| 4:00–4:30 | Briefly mention Pipelines #4 and #5 — `$addToSet`, `$switch` in `$group._id` |
| 4:30–5:30 | Run a `curl` command in terminal to show raw JSON output |
| 5:30–7:00 | Answer reviewer questions using the Q&A section above |
