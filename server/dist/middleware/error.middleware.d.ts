import { Request, Response, NextFunction } from 'express';
/**
 * ------------------------------------------------------------------------------------------
 * CUSTOM APP ERROR CLASS
 * ------------------------------------------------------------------------------------------
 * This extends the default JavaScript Error class to include an HTTP status code.
 * Use this for known/expected errors in your app (e.g. "User not found", "Invalid input").
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
/**
 * ------------------------------------------------------------------------------------------
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ------------------------------------------------------------------------------------------
 * This middleware catches all errors passed using `next(err)` in your app.
 * It MUST be registered as the LAST middleware in your Express app.
 */
export declare const errorHandler: (err: Error | AppError, _req: Request, // Not used here, but required by Express for error middleware
res: Response, _next: NextFunction) => void;
