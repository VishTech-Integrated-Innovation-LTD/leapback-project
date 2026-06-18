"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importing express framework
const express_1 = __importDefault(require("express"));
// Security middleware - sets various HTTP headers to protect against common web vulnerabilities
// import helmet from 'helmet';
// HTTP request logger middleware (great for development)
const morgan_1 = __importDefault(require("morgan"));
// Utility to load environment variables from .env file into process.env
const dotenv_1 = __importDefault(require("dotenv"));
// -------------------------------------------------------------------------------------------------
// Load environment variables from .env file (should be done as early as possible)
dotenv_1.default.config();
// Importing Security middleware
const security_middleware_1 = require("./middleware/security.middleware");
// Importing Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const quote_routes_1 = __importDefault(require("./routes/quote.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Import Global Error Handler
const error_middleware_1 = require("./middleware/error.middleware");
// Create Express application instance
const app = (0, express_1.default)();
// ======================
// MIDDLEWARE: REQUEST PARSING
// ======================
// Built-in middleware to parse incoming requests with JSON payloads
// 10kb limit prevents oversized payload attacks
app.use(express_1.default.json());
// ======================
// SECURITY
// ======================
app.use(security_middleware_1.helmetConfig); // secure HTTP headers
app.use(security_middleware_1.corsConfig); // locked to VITE_FRONTEND_URL
app.use(security_middleware_1.hppConfig); // block duplicate query params
// ======================
//  LOGGING - development only
// HTTP request logger - 'dev' format is colorful and concise (good for development)
// ======================
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// ======================
// ROUTES WITH RATE LIMITING
// Auth is strict (10/15min) - everything else is generous (100/15min)
// Download gets its own moderate limit (20/15min) applied on top of apiLimiter
// ======================
app.use('/auth', security_middleware_1.authLimiter, auth_routes_1.default);
app.use('/users', security_middleware_1.apiLimiter, user_routes_1.default);
app.use('/quotes', security_middleware_1.apiLimiter, quote_routes_1.default);
app.use('/clients', security_middleware_1.apiLimiter, client_routes_1.default);
app.use('/inventory', security_middleware_1.apiLimiter, inventory_routes_1.default);
app.use('/invoices', security_middleware_1.apiLimiter, invoice_routes_1.default);
app.use('/invoices/:id/download', security_middleware_1.downloadLimiter);
app.use('/dashboard', security_middleware_1.apiLimiter, dashboard_routes_1.default);
// ======================
// GLOBAL ERROR HANDLER
// ======================
app.use(error_middleware_1.errorHandler);
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