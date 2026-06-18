import { Model, Optional } from 'sequelize';
interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault: boolean;
    currency?: string;
    sortCode?: string;
}
interface CompanySettingAttributes {
    id: string;
    companyName: string;
    companyAddress: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    invoiceFooter: string | null;
    defaultVatRate: number;
    logoUrl: string | null;
    taxId: string | null;
    website: string | null;
    bankAccounts: BankAccount[];
    createdAt?: Date;
    updatedAt?: Date;
}
interface CompanySettingCreationAttributes extends Optional<CompanySettingAttributes, 'id'> {
}
declare class CompanySetting extends Model<CompanySettingAttributes, CompanySettingCreationAttributes> implements CompanySettingAttributes {
    id: string;
    companyName: string;
    companyAddress: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    invoiceFooter: string | null;
    defaultVatRate: number;
    logoUrl: string | null;
    taxId: string | null;
    website: string | null;
    bankAccounts: BankAccount[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default CompanySetting;
