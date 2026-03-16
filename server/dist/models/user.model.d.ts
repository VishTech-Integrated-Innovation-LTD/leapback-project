import { Model } from 'sequelize';
interface UserAttributes {
    sn?: number;
    id?: string;
    name: string;
    email: string;
    password: string;
    userType: 'admin';
    isActive: boolean;
    lastLoginAt?: Date | null;
}
interface UserInstance extends Model<UserAttributes>, UserAttributes {
}
declare const User: import("sequelize").ModelCtor<UserInstance>;
export default User;
