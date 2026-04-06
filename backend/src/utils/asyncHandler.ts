import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the centralized error-handling middleware
 * via next(error). This eliminates try/catch boilerplate in controllers.
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
