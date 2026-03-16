import { Model } from 'sequelize';
interface ClientAttributes {
    sn?: number;
    id?: string;
    clientName: string;
    contactPerson?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
}
interface ClientInstance extends Model<ClientAttributes>, ClientAttributes {
}
declare const Client: import("sequelize").ModelCtor<ClientInstance>;
export default Client;
