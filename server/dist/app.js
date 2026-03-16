"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importing express framework
const express_1 = __importDefault(require("express"));
// Middleware for enabling Cross-Origin Resource Sharing (CORS)
const cors_1 = __importDefault(require("cors"));
// Security middleware - sets various HTTP headers to protect against common web vulnerabilities
const helmet_1 = __importDefault(require("helmet"));
// HTTP request logger middleware (great for development)
const morgan_1 = __importDefault(require("morgan"));
// Utility to load environment variables from .env file into process.env
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file (should be done as early as possible)
dotenv_1.default.config();
// Create Express application instance
const app = (0, express_1.default)();
// Built-in middleware to parse incoming requests with JSON payloads
app.use(express_1.default.json());
// Adds security-related HTTP headers (X-XSS-Protection, Content-Security-Policy, etc.)
app.use((0, helmet_1.default)());
// Importing Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
// Configure CORS - controls which origins are allowed to access the API
const corsOptions = {
    // Use environment variable for frontend URL (recommended for production)
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    // Allowed HTTP methods from the frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Allow credentials (cookies, authorization headers, etc.) - enable only if needed
    // credentials: true,
    // How long preflight OPTIONS requests can be cached (in seconds)
    maxAge: 86400, // = 24 hours
};
// Apply CORS middleware with our configuration
app.use((0, cors_1.default)(corsOptions));
// HTTP request logger - 'dev' format is colorful and concise (good for development)
app.use((0, morgan_1.default)('dev'));
// Optional: global error handler (you can expand this later)
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
// Export the configured Express app instance
exports.default = app;
// // Importing express
// import express from 'express';
// // Importing cors for handling Cross-Origin Resource Sharing
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan'
// // Importing dotenv to load env variables
// import dotenv from 'dotenv';
// // Loads .env file contents into process.env
// dotenv.config();
// // Initialize the Express application
// const app = express();
// // Middleware to parse incoming JSON requests (For communication using json in the server)
// app.use(express.json());
// app.use(helmet());
// // CORS options that allows to accept specific methods from a particular domain
// const corsOptions = {
//     // origin: "http://localhost:5173",
//     origin: `${process.env.VITE_FRONTEND_URL}`,
//     methods: ["POST", "GET", "PUT", "DELETE"],
// };
// // Enable CORS
// app.use(cors(corsOptions));
// app.use(morgan('dev'))
// // Export app
// export default app;
//# sourceMappingURL=app.js.map