# Walkthrough: PL/SQL Stored Procedures for WarrantyVault

## Summary

Added **5 PL/pgSQL stored procedures** to the WarrantyVault backend, complementing the existing 5 trigger functions. Each procedure encapsulates reusable business logic callable via API endpoints.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| [procedures.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/config/procedures.ts) | **NEW** | 5 stored procedures + 2 supporting tables |
| [procedureController.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/controllers/procedureController.ts) | **NEW** | 5 controller handlers |
| [procedureRoutes.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/routes/procedureRoutes.ts) | **NEW** | Route definitions |
| [database-postgres.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/config/database-postgres.ts) | **MODIFIED** | Calls [initProcedures()](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/config/procedures.ts#3-353) at startup |
| [index.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/index.ts) | **MODIFIED** | Mounts `/api/procedures` routes |

## Procedures Created

| # | Name | Type | Purpose |
|---|------|------|---------|
| 1 | `sp_register_product` | PROCEDURE | Atomic product registration with validation |
| 2 | `sp_transfer_ownership` | PROCEDURE | Transfer product between users with audit trail |
| 3 | `sp_bulk_update_warranty_status` | PROCEDURE | Batch recalculate warranty status for all user products |
| 4 | `sp_purge_expired_products` | PROCEDURE | Archive & delete products expired beyond N days |
| 5 | `sp_generate_product_report` | FUNCTION | Return aggregated stats (category counts, warranty breakdown, totals) |

## Supporting Tables

- **`ownership_transfer_log`** — Records each ownership transfer (product_id, from_user, to_user, timestamp)
- **`products_archive`** — Stores archived products before deletion

## API Endpoints

All endpoints require JWT authentication.

| Method | Endpoint | Procedure Called |
|--------|----------|-----------------|
| `POST` | `/api/procedures/register-product` | `sp_register_product` |
| `POST` | `/api/procedures/transfer-ownership` | `sp_transfer_ownership` |
| `POST` | `/api/procedures/bulk-update-warranty` | `sp_bulk_update_warranty_status` |
| `POST` | `/api/procedures/purge-expired` | `sp_purge_expired_products` |
| `GET` | `/api/procedures/product-report` | `sp_generate_product_report` |

## Verification

- **TypeScript compilation**: ✅ Zero new errors from our changes (pre-existing errors in [productController.ts](file:///Users/kaviarasan/Desktop/Mtech%20Sem%202/DBMS/WarrantyVault/backend/src/controllers/productController.ts) are unrelated)
- **Startup**: Procedures are created via `CREATE OR REPLACE` at server startup, idempotent on restart
