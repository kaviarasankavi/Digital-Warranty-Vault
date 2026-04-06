/**
 * Utility for extracting a clean, user-displayable error message from
 * any error caught during an API call.
 *
 * The Axios interceptor in `api/axios.ts` attaches a `friendlyMessage`
 * to every rejected error.  This function prefers that value, then falls
 * back through several common structures.
 *
 * Usage:
 *   try {
 *     await productApi.create(data);
 *   } catch (err) {
 *     toast.error(extractApiError(err));
 *   }
 */
export function extractApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (!error) return fallback;

    // 1. friendlyMessage set by our Axios interceptor
    if (typeof error === 'object' && 'friendlyMessage' in error) {
        return (error as any).friendlyMessage;
    }

    // 2. Axios error with response data
    if (typeof error === 'object' && 'response' in error) {
        const data = (error as any).response?.data;
        if (data?.message) return data.message;
    }

    // 3. Plain Error object
    if (error instanceof Error) {
        return error.message;
    }

    // 4. String error
    if (typeof error === 'string') {
        return error;
    }

    return fallback;
}

/**
 * Extract the structured error code returned by the backend (if any).
 * Returns null when none is present.
 */
export function extractErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;

    if ('errorCode' in error) {
        return (error as any).errorCode ?? null;
    }

    if ('response' in error) {
        return (error as any).response?.data?.errorCode ?? null;
    }

    return null;
}
