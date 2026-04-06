# Exception Handling — Project Review Demo Guide

## 🎯 What to Demonstrate

You need to show a **4-layer exception handling architecture** — and explain **how** errors flow from controllers → through middleware → to a centralized handler → to the client, with structured, consistent JSON responses.

---

## 🏗️ Architecture Overview

```
Layer 1: Custom Error Classes (errors.ts)
    ↓  throw new ValidationError('...')
Layer 2: asyncHandler Wrapper (asyncHandler.ts)
    ↓  catches all async rejections → forwards via next(error)
Layer 3: Middleware Guards (authMiddleware.ts, validate.middleware.ts)
    ↓  throw errors before controller runs
Layer 4: Centralized Error Handler (index.ts)
    ↓  catches ALL errors → sends consistent JSON response
    + Process-Level Handlers (unhandledRejection, uncaughtException)
```

**Show this flow diagram first** — it gives the reviewer the big picture.

---

## 📋 Step-by-Step Demo Flow

### Step 1: Show the Error Class Hierarchy

**File:** `backend/src/utils/errors.ts`

### Step 2: Show the asyncHandler wrapper

**File:** `backend/src/utils/asyncHandler.ts`

### Step 3: Show the Centralized Error Handler

**File:** `backend/src/index.ts` (lines 48–128)

### Step 4: Demo with API calls

---

## 🔍 Layer 1: Custom Error Class Hierarchy

**File:** `backend/src/utils/errors.ts`

```typescript
// ─── Base Application Error ───────────────────────────────────────────
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        message: string,
        statusCode: number,
        errorCode: string,
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;          // distinguishes from programming bugs
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);  // fixes instanceof
        Error.captureStackTrace(this, this.constructor);     // clean stack trace
    }
}
```

### Error Subclasses

| Error Class | HTTP Status | Error Code | When It's Thrown |
|------------|------------|------------|-----------------|
| `ValidationError` | `400` | `VALIDATION_ERROR` | Bad input (missing name, invalid price, Zod failures) |
| `AuthenticationError` | `401` | `AUTHENTICATION_ERROR` | No token, expired token, invalid token |
| `AuthorizationError` | `403` | `AUTHORIZATION_ERROR` | User lacks permissions |
| `NotFoundError` | `404` | `NOT_FOUND` | Product/resource doesn't exist |
| `ConflictError` | `409` | `CONFLICT` | Duplicate email on registration |
| `DatabaseError` | `503` | `DATABASE_ERROR` | PostgreSQL procedure failures, connection issues |

```typescript
// ─── 400 — Bad Request / Validation ───────────────────────────────────
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

// ─── 401 — Authentication ─────────────────────────────────────────────
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

// ─── 403 — Authorization / Permissions ────────────────────────────────
export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

// ─── 404 — Not Found ──────────────────────────────────────────────────
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

// ─── 409 — Conflict / Duplicate ───────────────────────────────────────
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

// ─── 503 — Database / External Service ────────────────────────────────
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', details?: unknown) {
        super(message, 503, 'DATABASE_ERROR', details);
    }
}
```

**Key Points to Explain:**
- **Inheritance hierarchy** → all errors extend `AppError`, which extends `Error`
- **`isOperational`** → distinguishes expected errors (validation, auth) from unexpected bugs. Operational errors are safe to expose to the client; programming errors are not
- **`Object.setPrototypeOf`** → fixes TypeScript `instanceof` checking for class inheritance
- **`Error.captureStackTrace`** → generates a clean stack trace excluding the error constructor itself
- **`details`** → allows attaching extra context (e.g., Zod validation issues array)

---

## 🔍 Layer 2: asyncHandler Wrapper

**File:** `backend/src/utils/asyncHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
```

**Key Points to Explain:**
- **Problem it solves** → Express doesn't catch errors thrown inside `async` functions. If you `throw` in an `async` handler without try/catch, it becomes an `unhandledRejection` and crashes the server
- **Solution** → wraps the handler in `Promise.resolve(...).catch(next)`, automatically forwarding any error to Express's `next(error)` pipeline
- **Eliminates try/catch boilerplate** → every controller just `throw`s, never writes try/catch
- **Usage in controllers:**

```typescript
// WITHOUT asyncHandler — you need try/catch everywhere:
export const getProducts = async (req, res, next) => {
    try {
        // ... logic
    } catch (error) {
        next(error);  // must remember to call next()!
    }
};

// WITH asyncHandler — clean, just throw:
export const getProducts = asyncHandler(async (req, res) => {
    if (!userId) throw new AuthenticationError('Unauthorized');
    // ... logic — any throw is caught automatically
});
```

---

## 🔍 Layer 3: Middleware Guards

### 3a. Authentication Middleware

**File:** `backend/src/middleware/authMiddleware.ts`

```typescript
export const authMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET);
        } catch (jwtError: any) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token expired. Please log in again.');
            }
            throw new AuthenticationError('Invalid token.');
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new AuthenticationError('Invalid token. User not found.');
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);  // forwards to centralized handler
    }
};
```

**Key Points to Explain:**
- **Nested try/catch** → outer catch for general errors, inner catch specifically for JWT errors
- **Specific error messages** → "Token expired" vs "Invalid token" vs "No token provided" — helps the client show appropriate UI
- **Throws `AuthenticationError`** (401) — never a generic `Error`

### 3b. Zod Schema Validation Middleware

**File:** `backend/src/middleware/validate.middleware.ts`

```typescript
export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
    return (req, _res, next) => {
        try {
            schema.parse(req[source]);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.issues
                    .map((e) => `${e.path.join('.')}: ${e.message}`)
                    .join('; ');
                throw new ValidationError(messages, error.issues);
            }
            throw error;
        }
    };
};
```

**Key Points to Explain:**
- **Zod integration** → `schema.parse()` validates request data against a Zod schema
- **Structured error details** → converts Zod's `issues` array into a readable message and passes the raw issues as `details`
- **Configurable source** → can validate `body`, `params`, or `query`
- **Usage:** `router.post('/items', validate(createItemSchema), handler)`

---

## 🔍 Layer 4: Centralized Error Handler

**File:** `backend/src/index.ts` (lines 48–128)

```typescript
// ─── Centralized Error Handler ────────────────────────────────────────
app.use((err: Error | AppError, req, res, _next) => {

    // 1. Operational errors (our custom AppError hierarchy)
    if (err instanceof AppError) {
        logger.warn(`[${err.errorCode}] ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            errorCode: err.errorCode,
            message: err.message,
            ...(env.NODE_ENV === 'development' && err.details
                ? { details: err.details } : {}),
        });
        return;
    }

    // 2. Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        const messages = Object.values((err as any).errors || {})
            .map((e: any) => e.message);
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: messages.join(', ') || 'Validation failed',
        });
        return;
    }

    // 3. Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: 'Invalid ID format',
        });
        return;
    }

    // 4. MongoDB Duplicate Key (code 11000)
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        res.status(409).json({
            success: false,
            errorCode: 'CONFLICT',
            message: `Duplicate value for: ${field}`,
        });
        return;
    }

    // 5. JSON SyntaxError (malformed request body)
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: 'Malformed JSON in request body',
        });
        return;
    }

    // 6. Unexpected / Programming Errors (catch-all)
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
});
```

**Key Points to Explain:**
- **6 error categories handled** — from custom errors to Mongoose to JSON parsing
- **`instanceof AppError`** check — handles ALL our custom error classes in one block
- **Development-only details** — `details` and `stack` are only exposed in dev mode, not in production
- **Consistent JSON shape** — every error response has `{ success, errorCode, message }`
- **Fallback catch-all** — unknown errors get a generic 500 response (never leaks internal details in production)

### 4b. Process-Level Handlers

```typescript
// Catches promises that weren't awaited/caught
process.on('unhandledRejection', (reason: Error) => {
    logger.error('UNHANDLED REJECTION:', reason);
});

// Catches synchronous exceptions that escaped all handlers
process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);  // graceful shutdown
});
```

**Key Points to Explain:**
- **Last line of defense** — catches any errors that escaped Express middleware
- **`uncaughtException` → `process.exit(1)`** — the process is in an unknown state, so we exit to prevent data corruption
- **`unhandledRejection`** — logged but doesn't exit; the Express handler should have caught it

---

## 🔗 Real-World Usage (How Errors Flow Through the System)

### Example 1: Authentication Flow
```
1. Client sends request without token
2. authMiddleware → throw new AuthenticationError('No token')
3. catch block → next(error)
4. Centralized Handler → instanceof AppError → 401 JSON response
```

### Example 2: Product Not Found
```
1. Client requests GET /api/products/9999
2. Controller → products.length === 0 → throw new NotFoundError('Product')
3. asyncHandler catches it → next(error)
4. Centralized Handler → instanceof AppError → 404 JSON response
```

### Example 3: Duplicate Registration
```
1. Client sends POST /api/auth/register with existing email
2. Controller → existingUser found → throw new ConflictError('User exists')
3. asyncHandler catches it → next(error)
4. Centralized Handler → instanceof AppError → 409 JSON response
```

### Example 4: PostgreSQL Procedure Failure
```
1. Client sends POST /api/procedures/register-product with negative price
2. PostgreSQL → RAISE EXCEPTION 'purchasePrice cannot be negative'
3. Controller catches pgError → throw new DatabaseError(parsePgError(pgError))
4. asyncHandler catches it → next(error)
5. Centralized Handler → instanceof AppError → 503 JSON response
```

### Example 5: Mongoose Duplicate Key (No Custom Error Needed)
```
1. Client sends POST /api/auth/register
2. Mongoose → duplicate email → throws error with code 11000
3. asyncHandler catches it → next(error)
4. Centralized Handler → checks code === 11000 → 409 JSON response
```

---

## 🧪 Live API Demo (Terminal)

```bash
# 1. Test AuthenticationError — no token
curl -s http://localhost:5001/api/products \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "AUTHENTICATION_ERROR", ... }

# 2. Test AuthenticationError — expired/invalid token
curl -s http://localhost:5001/api/products \
  -H "Authorization: Bearer invalid.token.here" \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "AUTHENTICATION_ERROR", "message": "Invalid token." }

# 3. Get a valid token
TOKEN=$(curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')

# 4. Test ValidationError — empty product name
curl -s http://localhost:5001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST -d '{"name":"","purchasePrice":100}' \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "VALIDATION_ERROR", "message": "Product name is required." }

# 5. Test NotFoundError — non-existent product
curl -s http://localhost:5001/api/products/99999 \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "NOT_FOUND", "message": "Product not found" }

# 6. Test DatabaseError — negative price via stored procedure
curl -s http://localhost:5001/api/procedures/register-product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","purchasePrice":-50}' \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "DATABASE_ERROR", ... }

# 7. Test 404 Handler — non-existent route
curl -s http://localhost:5001/api/nonexistent \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "NOT_FOUND", "message": "Route /api/nonexistent not found" }

# 8. Test JSON SyntaxError — malformed body
curl -s http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{invalid json}' \
  | python3 -m json.tool
# Expected: { "success": false, "errorCode": "VALIDATION_ERROR", "message": "Malformed JSON in request body" }
```

---

## 💬 Common Review Questions & Answers

### Q: "What is the difference between operational and programming errors?"
> - **Operational errors** (`isOperational: true`) — expected failures like invalid input, missing auth, resource not found. The app knows how to handle them gracefully.
> - **Programming errors** — bugs like `TypeError`, `ReferenceError`, null dereference. The app is in an unknown state. These get the generic 500 response.

### Q: "Why use `instanceof AppError` instead of checking `err.statusCode`?"
> **A:** `instanceof` is type-safe and follows the class hierarchy. A raw `statusCode` property could exist on any object. `instanceof` guarantees the error was created by our code, not by a third-party library.

### Q: "Why use `asyncHandler` instead of try/catch in every controller?"
> **A:** DRY principle. Without it, every controller needs the exact same try/catch boilerplate. With `asyncHandler`, controllers just `throw` — the wrapper catches it and calls `next(error)`. It also prevents the common bug of forgetting to call `next(error)`.

### Q: "What is `Object.setPrototypeOf(this, new.target.prototype)`?"
> **A:** In TypeScript, when you extend a built-in class like `Error`, the prototype chain can break — `instanceof` checks may fail. `Object.setPrototypeOf` fixes this by manually restoring the prototype.

### Q: "Why does the centralized handler check for `11000` separately?"
> **A:** MongoDB uses error code `11000` for duplicate key violations. These aren't wrapped in our custom error classes because they originate from Mongoose at the driver level. The handler detects the code and maps it to a 409 Conflict response.

### Q: "How does PL/pgSQL integrate with the error system?"
> **A:** When a stored procedure uses `RAISE EXCEPTION`, PostgreSQL sends the error message to the Node.js driver. The controller catches it with `try/catch` and wraps it in a `DatabaseError`:
> ```typescript
> try {
>     await sql`CALL sp_register_product(...)`;
> } catch (pgError: any) {
>     throw new DatabaseError(parsePgError(pgError), pgError);
> }
> ```
> The `parsePgError` helper extracts the readable message from the PostgreSQL error object.

### Q: "Why `process.exit(1)` on uncaught exceptions?"
> **A:** After an uncaught exception, the Node.js process may have memory leaks, broken connections, or inconsistent state. Continuing could cause data corruption. The best practice is to log, exit, and let a process manager (PM2, Docker) restart the service.

---

## 📁 Files Involved

| File | Role |
|------|------|
| `utils/errors.ts` | 6 custom error classes (AppError + 5 subclasses) |
| `utils/asyncHandler.ts` | Async wrapper → catches & forwards to `next()` |
| `middleware/authMiddleware.ts` | JWT validation → throws `AuthenticationError` |
| `middleware/validate.middleware.ts` | Zod schema validation → throws `ValidationError` |
| `index.ts` (lines 48–128) | Centralized error handler (6 error types) |
| `index.ts` (lines 118–128) | Process-level handlers |
| `controllers/procedureController.ts` | `parsePgError()` + `DatabaseError` for PL/pgSQL |

---

## ⏱ Suggested Demo Timing (5–7 minutes)

| Time | What to Show |
|------|-------------|
| 0:00–0:30 | Draw/explain the 4-layer architecture flow |
| 0:30–1:30 | Open `errors.ts` — show `AppError` base class and 6 subclasses |
| 1:30–2:30 | Open `asyncHandler.ts` — explain `Promise.resolve().catch(next)` pattern |
| 2:30–3:30 | Open `authMiddleware.ts` — show nested try/catch and specific error messages |
| 3:30–4:30 | Open `index.ts` centralized handler — walk through the 6 error type checks |
| 4:30–5:30 | Open `procedureController.ts` — show PL/pgSQL `RAISE EXCEPTION` → `DatabaseError` flow |
| 5:30–6:30 | Demo 3-4 `curl` commands (no token, invalid token, empty name, negative price) |
| 6:30–7:00 | Answer questions using Q&A above |
