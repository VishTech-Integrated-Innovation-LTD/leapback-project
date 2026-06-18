import { Model } from 'sequelize';
export type UserRole = 'chief_admin' | 'admin' | 'staff';
interface UserAttributes {
    sn?: number;
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date | null;
}
interface UserInstance extends Model<UserAttributes>, UserAttributes {
}
declare const User: import("sequelize").ModelCtor<UserInstance>;
export default User;
