import { Request, Response, NextFunction } from 'express';

/**
 * ------------------------------------------------------------------------------------------
 * CUSTOM APP ERROR CLASS
 * ------------------------------------------------------------------------------------------
 * This extends the default JavaScript Error class to include an HTTP status code.
 * Use this for known/expected errors in your app (e.g. "User not found", "Invalid input").
 */
export class AppError extends Error {
  public readonly statusCode: number; // HTTP status code (e.g. 404, 400, 500)
  public readonly isOperational: boolean = true; // Marks this as an expected/handled error

  constructor(message: string, statusCode = 500) {
    super(message); // Call the parent Error constructor to set the message

    this.statusCode = statusCode;

    /**
     * Fixes prototype chain issues in TypeScript when extending built-in classes.
     * Ensures `instanceof AppError` works correctly.
     */
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * ------------------------------------------------------------------------------------------
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ------------------------------------------------------------------------------------------
 * This middleware catches all errors passed using `next(err)` in your app.
 * It MUST be registered as the LAST middleware in your Express app.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request, // Not used here, but required by Express for error middleware
  res: Response,
  _next: NextFunction // Not used, but included to match Express signature
): void => {
  
  /**
   * Log the error message with a timestamp.
   * Useful for debugging and monitoring in logs.
   */
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  /**
   * In development mode, log the full stack trace
   * so you can see exactly where the error came from.
   */
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  /**
   * Determine the HTTP status code:
   * - If it's an AppError, use its defined status code
   * - Otherwise, default to 500 (Internal Server Error)
   */
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  /**
   * Use the error message if available,
   * otherwise fall back to a generic message.
   */
  const message = err.message || 'Internal Server Error';

  /**
   * Send a consistent JSON response to the client.
   * This avoids Express's default HTML error response.
   */
  res.status(statusCode).json({
    success: false,
    message,

    /**
     * Only include the stack trace in development mode.
     * This prevents exposing internal details in production.
     */
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};