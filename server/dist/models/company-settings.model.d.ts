import { Model } from 'sequelize';
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
    id?: string;
    companyName: string;
    companyAddress?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    invoiceFooter?: string | null;
    defaultVatRate: number;
    logoUrl: string | null;
    taxId: string | null;
    website: string | null;
    bankAccounts: BankAccount[];
}
interface CompanySettingsInstance extends Model<CompanySettingAttributes>, CompanySettingAttributes {
}
declare const CompanySettings: import("sequelize").ModelCtor<CompanySettingsInstance>;
export default CompanySettings;
