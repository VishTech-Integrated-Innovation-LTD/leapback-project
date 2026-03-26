import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Importing User model 
import { User } from '../models';

// --------------------------------------------
// LOCAL TYPES
// --------------------------------------------

// Shape of the JWT payload - what gets encoded into the token on login
export interface JwtPayload {
    id: string;
    email: string;
    userType: 'admin';
}


// Extends Express's Request to include the logged-in user
// Available as req.user in any controller on a protected route
export interface AuthRequest extends Request {
    user: {
        id: string;
        name: string;
        email: string;
        userType: 'admin';
        isActive: boolean;
        lastLoginAt: Date | null;
    }
}



// ------------------------------------------------------------------------
// AUTHENTICATE
// Verifies the JWT token on every protected route
// Attaches the logged-in user to req.user for use in controllers
// ------------------------------------------------------------------------
const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const header = req.headers.authorization;

    // Token must be in the Authorization header as "Bearer <token>"
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }

    // Extract token from 'Bearer <token>' format
    const token = header.split(' ')[1];  // to remove the 'Bearer' keyword and display only the token
    try {
        // Verify and decode the token using the JWT secret from .env
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY as string
        ) as JwtPayload;

        // Check if token is invalid or expired
        if (!decoded) {
            res.status(401).json({
                message: "Invalid Token",
            });
            return; // Stop execution if token verification fails
        }

        const user = await User.findOne({
            where: { id: decoded.id, isActive: true },
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            res.status(401).json({ message: 'Account not found or inactive' });
            return;
        }

        // Attach the user to the request - available as req.user in all controllers
        req.user = user.toJSON() as AuthRequest['user'];

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};



export default authenticate;