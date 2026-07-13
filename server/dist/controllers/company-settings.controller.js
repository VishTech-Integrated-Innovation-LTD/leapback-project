"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultBankAccount = exports.deleteBankAccount = exports.updateBankAccount = exports.addBankAccount = exports.updateCompanySettings = exports.getCompanySettings = void 0;
const models_1 = require("../models"); // Adjust path if needed
// ==================================================================================
// @desc   GET COMPANY SETTINGS
// @route  GET /company-settings
// @access Private (Chief Admin only)
// Returns the single company settings record
// ==================================================================================
const getCompanySettings = async (req, res, next) => {
    try {
        let settings = await models_1.CompanySettings.findOne();
        // Create default record from .env or fallbacks if none exists
        if (!settings) {
            settings = await models_1.CompanySettings.create({
                companyName: process.env.COMPANY_NAME || 'Leapback',
                companyEmail: process.env.COMPANY_EMAIL || null,
                companyPhone: process.env.COMPANY_PHONE || null,
                companyAddress: process.env.COMPANY_ADDRESS || null,
                invoiceFooter: process.env.INVOICE_FOOTER || 'Thank you for your business.',
                defaultVatRate: Number(process.env.DEFAULT_VAT_RATE) || 7.5,
                bankAccounts: [
                    {
                        id: 'default',
                        bankName: process.env.COMPANY_BANK || 'GTBank',
                        accountNumber: process.env.COMPANY_ACCOUNT || '0123456789',
                        accountName: process.env.COMPANY_ACCOUNT_NAME || 'Leapback Limited',
                        isDefault: true,
                    }
                ],
            });
        }
        res.status(200).json({
            message: 'Company settings retrieved successfully',
            settings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCompanySettings = getCompanySettings;
// ==================================================================================
// @desc   UPDATE COMPANY SETTINGS
// @route  PUT /company-settings
// @access Private (Chief Admin only)
// Updates the single company settings record
// ==================================================================================
const updateCompanySettings = async (req, res, next) => {
    try {
        const { companyName, companyAddress, companyEmail, companyPhone, invoiceFooter, defaultVatRate, logoUrl, taxId, website, bankAccounts, } = req.body;
        // Find existing or create default
        let settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            settings = await models_1.CompanySettings.create({
                companyName: companyName || 'Leapback',
                companyAddress,
                companyEmail,
                companyPhone,
                invoiceFooter,
                defaultVatRate: defaultVatRate ?? 7.5,
                logoUrl,
                taxId,
                website,
                bankAccounts: bankAccounts || [],
            });
        }
        else {
            await settings.update({
                companyName,
                companyAddress,
                companyEmail,
                companyPhone,
                invoiceFooter,
                defaultVatRate,
                logoUrl,
                taxId,
                website,
                bankAccounts: bankAccounts || settings.bankAccounts,
            });
        }
        res.status(200).json({
            message: 'Company settings updated successfully',
            settings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCompanySettings = updateCompanySettings;
// ==================================================================================
// @desc   ADD BANK ACCOUNT
// @route  POST /company-settings/bank-accounts
// @access Private (Chief Admin only)
// ==================================================================================
const addBankAccount = async (req, res, next) => {
    try {
        const { bankName, accountNumber, accountName, isDefault = false, currency = 'NGN', sortCode } = req.body;
        if (!bankName || !accountNumber || !accountName) {
            res.status(400).json({ message: 'Bank name, account number and account name are required' });
            return;
        }
        let settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
            //   settings = await CompanySettings.create({ companyName: 'Leapback' });
        }
        const currentBanks = Array.isArray(settings.bankAccounts) ? settings.bankAccounts : [];
        // If setting as default, remove default from others
        let updatedBanks = currentBanks.map((bank) => ({
            ...bank,
            isDefault: isDefault ? false : bank.isDefault,
        }));
        updatedBanks.push({
            id: `bank_${Date.now()}`,
            bankName,
            accountNumber,
            accountName,
            isDefault,
            currency,
            sortCode,
        });
        await settings.update({ bankAccounts: updatedBanks });
        res.status(200).json({
            message: 'Bank account added successfully',
            bankAccounts: updatedBanks,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addBankAccount = addBankAccount;
// ==================================================================================
// @desc   UPDATE BANK ACCOUNT
// @route  PUT /company-settings/bank-accounts/:accountId
// @access Private (Chief Admin only)
// ==================================================================================
const updateBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        const bankAccounts = settings.bankAccounts.map(account => account.id === accountId ? { ...account, ...req.body } : account);
        await settings.update({ bankAccounts });
        res.json({ settings, message: 'Bank account updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update bank account' });
    }
};
exports.updateBankAccount = updateBankAccount;
// ==================================================================================
// @desc   DELETE BANK ACCOUNT
// @route  DELETE /company-settings/bank-accounts/:accountId
// @access Private (Chief Admin only)
// ==================================================================================
const deleteBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        const bankAccounts = settings.bankAccounts.filter(account => account.id !== accountId);
        // If we're deleting the default account, set another as default
        let updatedAccounts = bankAccounts;
        const deletedAccount = settings.bankAccounts.find(a => a.id === accountId);
        if (deletedAccount?.isDefault && bankAccounts.length > 0) {
            updatedAccounts = bankAccounts.map((account, index) => ({
                ...account,
                isDefault: index === 0,
            }));
        }
        await settings.update({ bankAccounts: updatedAccounts });
        res.json({ settings, message: 'Bank account deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete bank account' });
    }
};
exports.deleteBankAccount = deleteBankAccount;
// ==================================================================================
// @desc   SET DEFAULT BANK ACCOUNT
// @route  PATCH /company-settings/bank-accounts/:accountId/default
// @access Private (Chief Admin only)
// ==================================================================================
const setDefaultBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        const bankAccounts = settings.bankAccounts.map(account => ({
            ...account,
            isDefault: account.id === accountId,
        }));
        await settings.update({ bankAccounts });
        res.json({ settings, message: 'Default bank account set successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to set default bank account' });
    }
};
exports.setDefaultBankAccount = setDefaultBankAccount;
exports.default = {
    getCompanySettings: exports.getCompanySettings,
    updateCompanySettings: exports.updateCompanySettings,
    addBankAccount: exports.addBankAccount,
    updateBankAccount: exports.updateBankAccount,
    deleteBankAccount: exports.deleteBankAccount,
    setDefaultBankAccount: exports.setDefaultBankAccount
};
//# sourceMappingURL=company-settings.controller.js.map