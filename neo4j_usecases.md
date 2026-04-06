# Neo4j Use Cases
## Digital Warranty Vault & Product Authenticity Verification System

---

## Overview

The project uses a **polyglot persistence architecture** — MongoDB for document storage, Neo4j for relationship-centric data. Below are the core Neo4j use cases.

---

## 1. 🕓 Ownership History Tracking (Most Critical)

**Problem with relational/document DB:** Traversing a chain of ownership transfers (A→B→C→D) requires multiple JOINs or embedded arrays that grow unbounded.

**Neo4j Solution:**
```cypher
MATCH path = (s:Serial {serial_hash: $hash})-[:OWNED_BY*]->(o:Owner)
RETURN path ORDER BY relationships(path)[0].acquired_at
```

- Each `(:Serial)-[:OWNED_BY {acquired_at, relinquished_at}]->(:Owner)` relationship captures **temporal ownership** natively.
- The `TRANSFERRED_TO` relationship between `(:Owner)` nodes records the **transfer event** with metadata like `transfer_type` (sale, gift, warranty claim).
- The **frontend `OwnershipTimeline` component** directly consumes this graph data to render a visual chain.

---

## 2. 🔍 Product Authenticity Audit Trail

**Problem:** Logging every verification check against a serial and detecting patterns requires complex queries in relational DBs.

**Neo4j Solution:**
```cypher
(:Serial)-[:VERIFIED {checked_at, result}]->(:AuthCheck)
```

- Every scan/verification is stored as a `(:AuthCheck)` node linked to the `(:Serial)`.
- Enables **chronological verification history** per product with a single graph traversal.
- **Fraud detection** via pattern matching — if the same serial is verified from multiple locations within 24 hours:

```cypher
MATCH (s:Serial)-[:VERIFIED]->(ac1:AuthCheck),
      (s)-[:VERIFIED]->(ac2:AuthCheck)
WHERE ac1.check_id <> ac2.check_id
  AND duration.between(ac1.checked_at, ac2.checked_at).hours < 24
RETURN s, ac1, ac2
```

---

## 3. 🏭 Vendor → Product → Serial Graph Traversal

**Problem:** Finding all serials for a vendor's products requires multi-table JOINs.

**Neo4j Solution:**
```cypher
MATCH (v:Vendor)-[:MANUFACTURES]->(p:Product)-[:HAS_SERIAL]->(s:Serial)
WHERE v.vendor_id = $vendorId
RETURN p.name, count(s) as serial_count
```

- The `MANUFACTURES` → `HAS_SERIAL` relationship chain allows **multi-hop traversal** in one query.
- Surfaces insights like "how many units of each product model are in the field."

---

## 4. 🔎 Current Owner Lookup (Null-terminated Chains)

**Problem:** Determining who *currently* owns a product requires checking which ownership record has no end date.

**Neo4j Solution:**
```cypher
MATCH (s:Serial {serial_hash: $hash})-[r:OWNED_BY]->(o:Owner)
WHERE r.relinquished_at IS NULL
RETURN o
```

- The `relinquished_at: null` pattern on the relationship property elegantly represents the **current (open) ownership** without a separate "current_owner" field.

---

## 5. 📊 Ownership Graph Visualization (Frontend)

**API Endpoint:** `GET /api/ownership/graph/:serialId`

- Neo4j returns the full subgraph of nodes and relationships.
- The **`OwnershipTimeline` component** renders this as an interactive visual timeline.
- Useful for **due diligence** during a purchase — a buyer can see the full provenance chain.

---

## Graph Model Summary

### Node Types

| Node | Key Properties |
|------|---------------|
| `(:Vendor)` | `vendor_id`, `name`, `mongo_id` |
| `(:Product)` | `product_id`, `name`, `model_code`, `mongo_id` |
| `(:Serial)` | `serial_id`, `serial_hash`, `status`, `mongo_id` |
| `(:Owner)` | `owner_id`, `name`, `mongo_id` |
| `(:AuthCheck)` | `check_id`, `checked_at`, `verification_result` |

### Relationship Types

| Relationship | From → To | Key Properties |
|-------------|-----------|----------------|
| `MANUFACTURES` | `Vendor → Product` | `since` |
| `HAS_SERIAL` | `Product → Serial` | `manufactured_at` |
| `OWNED_BY` | `Serial → Owner` | `acquired_at`, `relinquished_at`, `proof_document` |
| `TRANSFERRED_TO` | `Owner → Owner` | `date`, `serial_id`, `transfer_type` |
| `VERIFIED` | `Serial → AuthCheck` | `checked_at`, `result` |

---

## Use Case ↔ API Endpoint Mapping

| Use Case | Neo4j Query Pattern | API Endpoint |
|----------|--------------------|-|
| Ownership history | `(:Serial)-[:OWNED_BY*]->(:Owner)` | `GET /ownership/:id/history` |
| Current owner | `OWNED_BY {relinquished_at: null}` | `GET /ownership/:id/current` |
| Transfer events | `(:Owner)-[:TRANSFERRED_TO]->(:Owner)` | `POST /ownership/transfer` |
| Authenticity audit | `(:Serial)-[:VERIFIED]->(:AuthCheck)` | `GET /authenticity/checks/:id` |
| Fraud detection | Pattern match on `:AuthCheck` timestamps | Internal service logic |
| Vendor-Product-Serial graph | `MANUFACTURES → HAS_SERIAL` | `GET /ownership/graph/:id` |

---

## Why NOT just MongoDB?

| Requirement | MongoDB Limitation | Neo4j Advantage |
|-------------|-------------------|-|
| Multi-hop ownership chains | Needs recursive `$lookup` (slow) | Native `[:OWNED_BY*]` path query |
| Fraud pattern detection | Aggregation pipeline complexity | Graph pattern matching in one query |
| Real-time graph traversal | No native graph support | Optimized for relationship traversal |
| Temporal ownership (who owned it when) | Manually managed arrays | Relationship properties with timestamps |

> **Key Insight:** Ownership and provenance are inherently **graph problems** — the data is defined by its relationships, not just its attributes. Neo4j excels here because it stores and traverses relationships as first-class citizens.
