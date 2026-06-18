import { Request, Response, NextFunction } from 'express';
export type UserRole = 'chief_admin' | 'admin' | 'staff';
export interface JwtPayload {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}
export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        lastLoginAt: Date | null;
    };
}
declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default authenticate;
