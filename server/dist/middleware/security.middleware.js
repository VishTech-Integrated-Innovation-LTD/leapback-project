"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLimiter = exports.apiLimiter = exports.authLimiter = exports.hppConfig = exports.corsConfig = exports.helmetConfig = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
// ---------------------------------------------------------------------------------------------
// HELMET
// Sets secure HTTP headers - prevents clickjacking, MIME sniffing, XSS etc.
// Configured specifically for an API (no need for browser security policies)
// ---------------------------------------------------------------------------------------------
exports.helmetConfig = (0, helmet_1.default)({
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
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        const allowed = (process.env.VITE_FRONTEND_URL ?? 'http://localhost:3000')
            .split(',')
            .map(o => o.trim());
        // Allow requests with no origin (e.g. Postman, server-to-server)
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'], // needed for PDF download headers
});
// ---------------------------------------------------------------------------------------------
// HPP - HTTP Parameter Pollution Protection
// Prevents attacks that send duplicate query params e.g. ?status=paid&status=sent
// Picks the last value and ignores duplicates
// ---------------------------------------------------------------------------------------------
exports.hppConfig = (0, hpp_1.default)();
// ---------------------------------------------------------------------------------------------
// RATE LIMITING HELPER
// Creates a rate limiter with a consistent error response shape
// ---------------------------------------------------------------------------------------------
const createLimiter = (windowMs, max, message) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true, // sends RateLimit-* headers so the frontend knows
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ message });
    },
});
// ---------------------------------------------------------------------------------------------
// AUTH RATE LIMITER
// Strict - prevents brute force attacks on the login endpoint
// 10 attempts per 15 minutes per IP
// e.g. if someone keeps guessing passwords, they get locked out quickly
// ---------------------------------------------------------------------------------------------
exports.authLimiter = createLimiter(15 * 60 * 1000, // 15 minutes
10, // 10 requests max
'Too many login attempts. Please wait 15 minutes before trying again.');
// ---------------------------------------------------------------------------------------------
// API RATE LIMITER
// Generous - internal staff tool with predictable low volume usage
// 100 requests per 15 minutes per IP
// ---------------------------------------------------------------------------------------------
exports.apiLimiter = createLimiter(15 * 60 * 1000, // 15 minutes
100, // 100 requests max
'Too many requests. Please slow down and try again shortly.');
// ---------------------------------------------------------------------------------------------
// PDF/DOWNLOAD RATE LIMITER
// Moderate - file serving is expensive, limit to prevent abuse
// 20 downloads per 15 minutes per IP
// ---------------------------------------------------------------------------------------------
exports.downloadLimiter = createLimiter(15 * 60 * 1000, // 15 minutes
20, // 20 requests max
'Too many download requests. Please wait before downloading again.');
//# sourceMappingURL=security.middleware.js.map