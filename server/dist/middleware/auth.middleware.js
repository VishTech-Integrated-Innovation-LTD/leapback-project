"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Importing User model 
const models_1 = require("../models");
// ------------------------------------------------------------------------
// AUTHENTICATE
// Verifies the JWT token on every protected route
// Attaches the logged-in user to req.user for use in controllers
// ------------------------------------------------------------------------
const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;
    // Token must be in the Authorization header as "Bearer <token>"
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    // Extract token from 'Bearer <token>' format
    const token = header.split(' ')[1]; // to remove the 'Bearer' keyword and display only the token
    try {
        // Verify and decode the token using the JWT secret from .env
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // Check if token is invalid or expired
        if (!decoded) {
            res.status(401).json({
                message: "Invalid Token",
            });
            return; // Stop execution if token verification fails
        }
        const user = await models_1.User.findOne({
            where: { id: decoded.id, isActive: true },
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            res.status(401).json({ message: 'Account not found or inactive' });
            return;
        }
        // Attach the user to the request - available as req.user in all controllers
        // req.user = user.toJSON() as AuthRequest['user'];
        // Cast to AuthRequest to attach user - TypeScript is satisfied
        req.user = user.toJSON();
        // Proceed to the next middleware or route handler
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.default = authenticate;
//# sourceMappingURL=auth.middleware.js.map