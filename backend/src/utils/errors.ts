/**
 * Custom Error Classes for WarrantyVault
 * Provides structured, typed exceptions for the entire backend.
 */

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
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

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
