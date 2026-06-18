// api/settings.api.ts
import api from '../lib/axios';
import type { BankAccount, CompanySettings } from '../types';




export const getCompanySettings = async (): Promise<{ settings: CompanySettings }> => {
  const response = await api.get('/company-settings');
  return response.data;
};

export const updateCompanySettings = async (data: Partial<CompanySettings>): Promise<{ settings: CompanySettings; message: string }> => {
  const response = await api.put('/company-settings', data);
  return response.data;
};

export const addBankAccount = async (data: Omit<BankAccount, 'id' | 'isDefault'>): Promise<{ settings: CompanySettings; message: string }> => {
  const response = await api.post('/company-settings/bank-accounts', data);
  return response.data;
};



export const updateBankAccount = async (accountId: string, data: Partial<BankAccount>): Promise<{ settings: CompanySettings; message: string }> => {
  const response = await api.put(`/company-settings/bank-accounts/${accountId}`, data);
  return response.data;
};

export const deleteBankAccount = async (accountId: string): Promise<{ settings: CompanySettings; message: string }> => {
  const response = await api.delete(`/company-settings/bank-accounts/${accountId}`);
  return response.data;
};

export const setDefaultBankAccount = async (accountId: string): Promise<{ settings: CompanySettings; message: string }> => {
  const response = await api.patch(`/company-settings/bank-accounts/${accountId}/default`);
  return response.data;
};