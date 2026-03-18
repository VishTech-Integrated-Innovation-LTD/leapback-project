// Importing express framework
import express from 'express';

// Middleware for enabling Cross-Origin Resource Sharing (CORS)
import cors from 'cors';

// Security middleware - sets various HTTP headers to protect against common web vulnerabilities
import helmet from 'helmet';

// HTTP request logger middleware (great for development)
import morgan from 'morgan';

// Utility to load environment variables from .env file into process.env
import dotenv from 'dotenv';

// Load environment variables from .env file (should be done as early as possible)
dotenv.config();

// Create Express application instance
const app = express();

// Built-in middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Adds security-related HTTP headers (X-XSS-Protection, Content-Security-Policy, etc.)
app.use(helmet());


// Importing Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import quoteRoutes from './routes/quote.routes';
import clientRoutes from './routes/client.routes';
import inventoryRoutes from './routes/inventory.routes';



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
app.use(cors(corsOptions));

// HTTP request logger - 'dev' format is colorful and concise (good for development)
app.use(morgan('dev'));

// Optional: global error handler (you can expand this later)
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });



// Routes
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/quotes', quoteRoutes)
app.use('/clients', clientRoutes)
app.use('/inventory', inventoryRoutes)






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