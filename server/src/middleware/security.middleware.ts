import rateLimit from 'express-rate-limit';
import hpp       from 'hpp';
import helmet    from 'helmet';
import cors      from 'cors';
import { Request, Response } from 'express';

// ---------------------------------------------------------------------------------------------
// HELMET
// Sets secure HTTP headers - prevents clickjacking, MIME sniffing, XSS etc.
// Configured specifically for an API (no need for browser security policies)
// ---------------------------------------------------------------------------------------------

export const helmetConfig = helmet({
  // Disable CSP for a pure API - no HTML pages served
  contentSecurityPolicy: false,

  // Allow cross-origin requests for PDF downloads
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ---------------------------------------------------------------------------------------------
// CORS
// Restricts which origins can call the API
// Configure CORS - controls which origins are allowed to access the API
// In production this should be locked to the url only
// ---------------------------------------------------------------------------------------------
export const corsConfig = cors({
  origin: (origin, callback) => {
    // const allowed = (process.env.VITE_FRONTEND_URL ?? 'http://localhost:3000')
    //   .split(',')
    //   .map(o => o.trim());

     // Allowed origins
    const allowedOrigins = [
      'https://leapback-quotation-project.vercel.app',   // Your current Vercel URL
      'http://localhost:5173',                           // Vite default
      'http://localhost:3000',
      'http://localhost:8080'
    ];

    // Allow requests with no origin (e.g. Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials:      true,
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  exposedHeaders:   ['Content-Disposition'],  // needed for PDF download headers
});

// ---------------------------------------------------------------------------------------------
// HPP - HTTP Parameter Pollution Protection
// Prevents attacks that send duplicate query params e.g. ?status=paid&status=sent
// Picks the last value and ignores duplicates
// ---------------------------------------------------------------------------------------------
export const hppConfig = hpp();

// ---------------------------------------------------------------------------------------------
// RATE LIMITING HELPER
// Creates a rate limiter with a consistent error response shape
// ---------------------------------------------------------------------------------------------
const createLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,   // sends RateLimit-* headers so the frontend knows
    legacyHeaders:   false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ message });
    },
  });

// ---------------------------------------------------------------------------------------------
// AUTH RATE LIMITER
// Strict - prevents brute force attacks on the login endpoint
// 10 attempts per 15 minutes per IP
// e.g. if someone keeps guessing passwords, they get locked out quickly
// ---------------------------------------------------------------------------------------------
export const authLimiter = createLimiter(
  15 * 60 * 1000,   // 15 minutes
  10,               // 10 requests max
  'Too many login attempts. Please wait 15 minutes before trying again.'
);

// ---------------------------------------------------------------------------------------------
// API RATE LIMITER
// Generous - internal staff tool with predictable low volume usage
// 100 requests per 15 minutes per IP
// ---------------------------------------------------------------------------------------------
export const apiLimiter = createLimiter(
  15 * 60 * 1000,   // 15 minutes
  100,              // 100 requests max
  'Too many requests. Please slow down and try again shortly.'
);

// ---------------------------------------------------------------------------------------------
// PDF/DOWNLOAD RATE LIMITER
// Moderate - file serving is expensive, limit to prevent abuse
// 20 downloads per 15 minutes per IP
// ---------------------------------------------------------------------------------------------
export const downloadLimiter = createLimiter(
  15 * 60 * 1000,   // 15 minutes
  20,               // 20 requests max
  'Too many download requests. Please wait before downloading again.'
);