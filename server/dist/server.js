"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import the configured Express application
const app_1 = __importDefault(require("./app"));
// Determine the port from environment variable or fallback to 5000
const PORT = process.env.PORT || 5000;
// Basic health-check / welcome route (useful for testing & monitoring)
app_1.default.get(['', '/', '/health', '/api'], (_req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Leapback backend is running fine!',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// Optional: 404 handler for unmatched routes (should come after all other routes)
app_1.default.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});
// Start the server and listen for incoming connections
app_1.default.listen(PORT, () => {
    console.log(`Leapback API is running on port ${PORT}`);
    console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.VITE_FRONTEND_URL || '(not set)'}`);
});
// // Importing app.ts file
// import app from './app';
// // Defining the PORT the server will listen on 
// const PORT = process.env.PORT || 5000;
// // To start up the server and listen on the defined PORT 
// app.listen(PORT, () => {
//     console.log(`Leapback API is running on PORT ${PORT}`);
// })
// // To test if it's working on Postman
// app.get('', (_req, res) => {
// res.status(200).json({message: "Leapback backend is running fine!!!..."})
// });
//# sourceMappingURL=server.js.map