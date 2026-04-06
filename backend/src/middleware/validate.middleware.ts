import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Express middleware that validates the request body (or params/query)
 * against a Zod schema. Throws a ValidationError on failure.
 *
 * Usage:
 *   router.post('/items', validate(createItemSchema), handler);
 */
export const validate = (
    schema: ZodSchema,
    source: 'body' | 'params' | 'query' = 'body'
) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            schema.parse(req[source]);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.issues
                    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                    .join('; ');
                throw new ValidationError(messages, error.issues);
            }
            throw error;
        }
    };
};
