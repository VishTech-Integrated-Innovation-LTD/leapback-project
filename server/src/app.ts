// Importing express framework
import express from 'express';

// ------- MIDDLEWARE -------------------------------------------------------------------
// Middleware for enabling Cross-Origin Resource Sharing (CORS)
import cors from 'cors';

// Security middleware - sets various HTTP headers to protect against common web vulnerabilities
// import helmet from 'helmet';

// HTTP request logger middleware (great for development)
import morgan from 'morgan';

// Utility to load environment variables from .env file into process.env
import dotenv from 'dotenv';
// -------------------------------------------------------------------------------------------------

// Load environment variables from .env file (should be done as early as possible)
dotenv.config();

// Importing Security middleware
import { 
  helmetConfig,
  corsConfig,
  hppConfig,
  authLimiter,
  apiLimiter,
  downloadLimiter
 } from './middleware/security.middleware';


// Importing Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import quoteRoutes from './routes/quote.routes';
import clientRoutes from './routes/client.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoiceRoutes from './routes/invoice.routes';


// Import Global Error Handler
import { errorHandler } from './middleware/error.middleware';


// Create Express application instance
const app = express();


// ======================
// MIDDLEWARE: REQUEST PARSING
// ======================
// Built-in middleware to parse incoming requests with JSON payloads
// 10kb limit prevents oversized payload attacks
app.use(express.json());


// ======================
// SECURITY
// ======================
app.use(helmetConfig);   // secure HTTP headers
app.use(corsConfig);     // locked to VITE_FRONTEND_URL
app.use(hppConfig);      // block duplicate query params


// ======================
//  LOGGING — development only
// HTTP request logger - 'dev' format is colorful and concise (good for development)
// ======================
if (process.env.NODE_ENV === 'development') {
app.use(morgan('dev'));
}



// ======================
// ROUTES WITH RATE LIMITING
// Auth is strict (10/15min) - everything else is generous (100/15min)
// Download gets its own moderate limit (20/15min) applied on top of apiLimiter
// ======================
app.use('/auth',       authLimiter, authRoutes)
app.use('/users',      apiLimiter,  userRoutes)
app.use('/quotes',     apiLimiter,  quoteRoutes)
app.use('/clients',    apiLimiter,  clientRoutes)
app.use('/inventory',  apiLimiter,  inventoryRoutes)
app.use('/invoices',   apiLimiter,  invoiceRoutes)
app.use('/invoices/:id/download',         downloadLimiter);


// ======================
// GLOBAL ERROR HANDLER
// ======================
app.use(errorHandler);


// Export the configured Express app instance
export default app;







































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