import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PlusIcon,
  XIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningIcon,
  LockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeSlashIcon,
  EyeIcon,
  BuildingIcon,
  InvoiceIcon,
  FloppyDiskIcon,
  SpinnerGapIcon,
  // BankIcon,
} from '@phosphor-icons/react';
import { getAllUsers, registerUser, updateUser, deleteUser } from '../../api/users.api';
import { getCompanySettings, updateCompanySettings, addBankAccount, updateBankAccount, deleteBankAccount, setDefaultBankAccount } from '../../api/company-settings.api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../stores/useToastStore';
import type { User as UserType, CompanySettings, BankAccount } from '../../types';

type UserRole = 'chief_admin' | 'admin' | 'staff';

// --------------------------------------------------------------------------
// API ERROR HELPER
// --------------------------------------------------------------------------
interface ApiError {
  response?: { data?: { message?: string } };
}

const getErrorMessage = (err: unknown): string => {
  const apiErr = err as ApiError;
  return apiErr?.response?.data?.message ?? 'Something went wrong';
};

// --------------------------------------------------------------------------
// ADD STAFF MODAL
// --------------------------------------------------------------------------
interface AddStaffModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const AddStaffModal = ({ onSuccess, onClose }: AddStaffModalProps) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user: authUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Only chief_admin can create chief_admin
    if (form.role === 'chief_admin' && authUser?.role !== 'chief_admin') {
      setError('Only Chief Admin can create another Chief Admin');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      toast.success('Staff member added successfully');
      onSuccess();
      setForm({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Add Staff Member</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Full Name *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Email *</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-[#E8A120]/50"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              {authUser?.role === 'chief_admin' && <option value="chief_admin">Chief Admin</option>}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-lg text-white/60 hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#E8A120] text-[#0A0F1E] font-semibold rounded-lg hover:bg-[#E8A120]/90 disabled:opacity-60 transition-colors">
              {loading ? <SpinnerGapIcon size={16} className="animate-spin mx-auto" /> : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// EDIT STAFF MODAL
// --------------------------------------------------------------------------
interface EditStaffModalProps {
  user: UserType;
  onSuccess: () => void;
  onClose: () => void;
}

const EditStaffModal = ({ user, onSuccess, onClose }: EditStaffModalProps) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await updateUser(user.id, {
        name: form.name,
        email: form.email,
        ...(form.password && { password: form.password }),
      });
      toast.success('Staff member updated successfully');
      onSuccess();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Edit Staff Member</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">
              New Password <span className="text-white/20">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <LockIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E8A120]/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 disabled:opacity-60 transition-colors"
            >
              {loading ? <SpinnerGapIcon size={16} className="animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// EDIT COMPANY MODAL
// --------------------------------------------------------------------------
interface EditCompanyModalProps {
  settings: CompanySettings;
  onSuccess: () => void;
  onClose: () => void;
}

const EditCompanyModal = ({ settings, onSuccess, onClose }: EditCompanyModalProps) => {
  const [form, setForm] = useState({
    companyName: settings.companyName,
    companyEmail: settings.companyEmail || '',
    companyPhone: settings.companyPhone || '',
    companyAddress: settings.companyAddress || '',
    invoiceFooter: settings.invoiceFooter || '',
    defaultVatRate: settings.defaultVatRate,
    taxId: settings.taxId || '',
    website: settings.website || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCompanySettings(form);
      toast.success('Company settings updated successfully');
      onSuccess();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 overflow-y-auto">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Edit Company Details</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-[#E8A120] text-sm font-semibold mb-3 flex items-center gap-2">
              <BuildingIcon size={16} />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-white/40 mb-1">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Company Email</label>
                <input
                  type="email"
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Company Phone</label>
                <input
                  type="text"
                  value={form.companyPhone}
                  onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/40 mb-1">Company Address</label>
                <textarea
                  rows={2}
                  value={form.companyAddress}
                  onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
            </div>
          </div>

          {/* Tax & Invoice Settings */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-[#E8A120] text-sm font-semibold mb-3 flex items-center gap-2">
              <InvoiceIcon size={16} />
              Tax & Invoice Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Default VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={form.defaultVatRate}
                  onChange={(e) => setForm({ ...form, defaultVatRate: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Tax ID / VAT Number</label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/40 mb-1">Invoice Footer Text</label>
                <textarea
                  rows={2}
                  value={form.invoiceFooter}
                  onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#E8A120]/50"
                  placeholder="Thank you for your business..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <SpinnerGapIcon size={16} className="animate-spin" /> : <><FloppyDiskIcon size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// ADD/EDIT BANK ACCOUNT MODAL
// --------------------------------------------------------------------------
interface BankAccountModalProps {
  account?: BankAccount | null;
  onSuccess: () => void;
  onClose: () => void;
}

const BankAccountModal = ({ account, onSuccess, onClose }: BankAccountModalProps) => {
  const [form, setForm] = useState({
    bankName: account?.bankName || '',
    accountNumber: account?.accountNumber || '',
    accountName: account?.accountName || '',
    currency: account?.currency || 'NGN',
    sortCode: account?.sortCode || '',
    isDefault: account?.isDefault || false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      setError('Bank name, account number, and account name are required');
      return;
    }
    setLoading(true);
    try {
      if (account) {
        // Update existing account
        await updateBankAccount(account.id, {
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          currency: form.currency,
          sortCode: form.sortCode,
        });
        // Handle default status separately if changed
        if (form.isDefault && !account.isDefault) {
          await setDefaultBankAccount(account.id);
        }
        toast.success('Bank account updated successfully');
      } else {
        // Add new account
        await addBankAccount(form);
        toast.success('Bank account added successfully');
      }
      onSuccess();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {account ? 'Edit Bank Account' : 'Add Bank Account'}
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Bank Name *</label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="e.g., GTBank, First Bank"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Account Number *</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              placeholder="e.g., 0123456789"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Account Name *</label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              placeholder="e.g., Leapback Limited"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
              >
                <option value="NGN">NGN - Naira</option>
                <option value="USD">USD - Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Sort Code</label>
              <input
                type="text"
                value={form.sortCode}
                onChange={(e) => setForm({ ...form, sortCode: e.target.value })}
                placeholder="Optional"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A120]/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded border-white/20 bg-white/5 text-[#E8A120] focus:ring-[#E8A120]/20"
            />
            <label htmlFor="isDefault" className="text-xs text-white/60">Set as default bank account</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 disabled:opacity-60 transition-colors"
            >
              {loading ? <SpinnerGapIcon size={16} className="animate-spin mx-auto" /> : (account ? 'Update Account' : 'Add Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// DELETE BANK ACCOUNT MODAL
// --------------------------------------------------------------------------
interface DeleteBankAccountModalProps {
  account: BankAccount;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

const DeleteBankAccountModal = ({ account, onConfirm, onClose, isLoading }: DeleteBankAccountModalProps) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
    <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <WarningIcon size={24} weight="fill" className="text-red-400" />
      </div>
      <h3 className="text-white font-semibold text-center mb-1">Delete Bank Account?</h3>
      <p className="text-white/40 text-sm text-center mb-5">
        Are you sure you want to delete "{account.bankName}" account ending with {account.accountNumber.slice(-4)}?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {isLoading ? <SpinnerGapIcon size={16} className="animate-spin mx-auto" /> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// --------------------------------------------------------------------------
// SETTINGS PAGE
// --------------------------------------------------------------------------
const SettingsPage = () => {
  // Removed unused queryClient
  const { user: authUser } = useAuthStore();
  const toast = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState<UserType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [deletingBankAccount, setDeletingBankAccount] = useState<BankAccount | null>(null);

  // Fetch company settings
  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  // Delete bank account mutation
  const deleteBankAccountMutation = useMutation({
    mutationFn: (accountId: string) => deleteBankAccount(accountId),
    onSuccess: () => {
      refetchSettings();
      setDeletingBankAccount(null);
      toast.success('Bank account deleted successfully');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Toggle active/inactive
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      refetchUsers();
      toast.success('Staff status updated');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete staff
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      refetchUsers();
      setDeleteTarget(null);
      toast.success('Staff member removed');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleStaffSuccess = () => {
    refetchUsers();
    setShowAddModal(false);
    setEditStaff(null);
  };

  const handleSettingsSuccess = () => {
    refetchSettings();
    setShowEditCompany(false);
    setShowAddBankAccount(false);
    setEditingBankAccount(null);
  };

  const settings = settingsData?.settings;
  const users = usersData?.users ?? [];

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-4xl space-y-6">

      {/* Section 1 — Company Details */}
      <div className="bg-[#0D1526] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E8A120] text-[#0A0F1E] text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="text-white font-semibold">Company Details</h3>
          </div>

          {authUser?.role === 'chief_admin' && (
            <button
              onClick={() => setShowEditCompany(true)}
              className="flex items-center gap-2 text-[#E8A120] text-sm hover:underline"
            >
              <PencilSimpleIcon size={16} />
              Edit Details
            </button>
          )}
        </div>

        {settingsLoading ? (
          <div className="flex justify-center py-8">
            <SpinnerGapIcon size={24} className="animate-spin text-[#E8A120]" />
          </div>
        ) : settings ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Company Name</span>
              <span className="text-white text-sm">{settings.companyName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Company Email</span>
              <span className="text-white text-sm">{settings.companyEmail || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Company Phone</span>
              <span className="text-white text-sm">{settings.companyPhone || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Company Address</span>
              <span className="text-white text-sm">{settings.companyAddress || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Website</span>
              <span className="text-white text-sm">{settings.website || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Tax ID / VAT Number</span>
              <span className="text-white text-sm">{settings.taxId || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">Default VAT Rate</span>
              <span className="text-white text-sm">{settings.defaultVatRate}%</span>
            </div>
            <div className="py-2">
              <span className="text-white/40 text-sm block mb-1">Invoice Footer</span>
              <span className="text-white text-sm">{settings.invoiceFooter || '—'}</span>
            </div>
          </div>
        ) : (
          <p className="text-white/40 text-sm">Failed to load settings</p>
        )}
      </div>

      {/* Section 1.5 — Bank Accounts */}
      <div className="bg-[#0D1526] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E8A120] text-[#0A0F1E] text-xs font-bold flex items-center justify-center">1.5</span>
            <h3 className="text-white font-semibold">Bank Accounts</h3>
          </div>
          {authUser?.role === 'chief_admin' && (
            <button
              onClick={() => setShowAddBankAccount(true)}
              className="flex items-center gap-2 text-[#E8A120] text-sm hover:underline"
            >
              <PlusIcon size={16} />
              Add Bank Account
            </button>
          )}
        </div>

        {settingsLoading ? (
          <div className="flex justify-center py-8">
            <SpinnerGapIcon size={24} className="animate-spin text-[#E8A120]" />
          </div>
        ) : !settings?.bankAccounts || settings.bankAccounts.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No bank accounts added yet.</p>
        ) : (
          <div className="space-y-3">
            {settings.bankAccounts.map((account: BankAccount) => (
              <div key={account.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium">{account.bankName}</h4>
                      {account.isDefault && (
                        <span className="text-xs bg-[#E8A120]/20 text-[#E8A120] px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">Account: {account.accountNumber}</p>
                    <p className="text-white/40 text-sm">Name: {account.accountName}</p>
                    {account.currency && (
                      <p className="text-white/30 text-xs mt-1">Currency: {account.currency}</p>
                    )}
                  </div>
                  {authUser?.role === 'chief_admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBankAccount(account)}
                        className="p-2 text-white/30 hover:text-[#E8A120] transition-colors rounded-lg hover:bg-[#E8A120]/5"
                        title="Edit bank account"
                      >
                        <PencilSimpleIcon size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingBankAccount(account)}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                        title="Delete bank account"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — Staff Accounts */}
      <div className="bg-[#0D1526] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E8A120] text-[#0A0F1E] text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="text-white font-semibold">Staff Accounts</h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#E8A120] text-[#0A0F1E] text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#E8A120]/90 transition-colors"
          >
            <PlusIcon size={14} weight="bold" />
            Add Staff Member
          </button>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center h-24">
            <SpinnerGapIcon size={24} className="animate-spin text-[#E8A120]" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No staff members found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrentUser = user.id === authUser?.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 bg-white/3 rounded-xl px-4 py-3"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${user.isActive
                      ? 'bg-[#E8A120]/10 text-[#E8A120]'
                      : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {getInitials(user.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{user.name}</p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-[#E8A120]/10 text-[#E8A120] px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>

                  <span className="text-white/40 text-xs capitalize hidden md:block">
                    {user.userType}
                  </span>

                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0
                    ${user.isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditStaff(user)}
                      className="p-2 text-white/30 hover:text-[#E8A120] transition-colors rounded-lg hover:bg-[#E8A120]/5"
                      title="Edit staff member"
                    >
                      <PencilSimpleIcon size={15} />
                    </button>

                    {!isCurrentUser && (
                      <button
                        onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
                        disabled={toggleMutation.isPending}
                        className={`p-2 transition-colors rounded-lg disabled:opacity-50
                          ${user.isActive
                            ? 'text-white/30 hover:text-red-400 hover:bg-red-500/5'
                            : 'text-white/30 hover:text-green-400 hover:bg-green-500/5'
                          }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive
                          ? <XCircleIcon size={15} weight="fill" />
                          : <CheckCircleIcon size={15} weight="fill" />
                        }
                      </button>
                    )}

                    {!isCurrentUser && (
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-colors rounded-lg"
                        title="Delete staff member"
                      >
                        <TrashIcon size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          onSuccess={handleStaffSuccess}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editStaff && (
        <EditStaffModal
          user={editStaff}
          onSuccess={handleStaffSuccess}
          onClose={() => setEditStaff(null)}
        />
      )}

      {showEditCompany && settings && (
        <EditCompanyModal
          settings={settings}
          onSuccess={handleSettingsSuccess}
          onClose={() => setShowEditCompany(false)}
        />
      )}

      {showAddBankAccount && (
        <BankAccountModal
          onSuccess={handleSettingsSuccess}
          onClose={() => setShowAddBankAccount(false)}
        />
      )}

      {editingBankAccount && (
        <BankAccountModal
          account={editingBankAccount}
          onSuccess={handleSettingsSuccess}
          onClose={() => setEditingBankAccount(null)}
        />
      )}

      {deletingBankAccount && (
        <DeleteBankAccountModal
          account={deletingBankAccount}
          isLoading={deleteBankAccountMutation.isPending}
          onConfirm={() => deleteBankAccountMutation.mutate(deletingBankAccount.id)}
          onClose={() => setDeletingBankAccount(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <WarningIcon size={24} weight="fill" className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center mb-1">Remove Staff Member?</h3>
            <p className="text-white/40 text-sm text-center mb-5">
              "{deleteTarget.name}" will be permanently removed from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? <SpinnerGapIcon size={16} className="animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;