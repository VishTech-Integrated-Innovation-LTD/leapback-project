import { useState }             from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  XIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningIcon,
  LockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { getAllUsers, registerUser, updateUser, deleteUser } from '../../api/users.api';
import { useAuthStore } from '../../store/authStore';
import type { User as UserType } from '../../types';

// --------------------------------------------------------------------------
// ADD STAFF MODAL
// --------------------------------------------------------------------------
interface AddStaffModalProps {
  onSuccess: () => void;
  onClose:   () => void;
}

const AddStaffModal = ({ onSuccess, onClose }: AddStaffModalProps) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await registerUser(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create staff member');
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Full Name *',  key: 'name',     type: 'text',     placeholder: 'e.g. Temi Okafor'       },
            { label: 'Email *',      key: 'email',    type: 'email',    placeholder: 'temi@leapback.ng'        },
            { label: 'Password *',   key: 'password', type: 'password', placeholder: 'Min. 8 characters'       },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/40 mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
              />
            </div>
          ))}

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
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add Staff'}
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
  user:      UserType;
  onSuccess: () => void;
  onClose:   () => void;
}

const EditStaffModal = ({ user, onSuccess, onClose }: EditStaffModalProps) => {
  const [form, setForm] = useState({
    name:     user.name,
    email:    user.email,
    password: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

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
        name:     form.name,
        email:    form.email,
        ...(form.password && { password: form.password }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update staff member');
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
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
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
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// SETTINGS PAGE
// --------------------------------------------------------------------------
const SettingsPage = () => {
  const queryClient       = useQueryClient();
  const { user: authUser } = useAuthStore();

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [editStaff,     setEditStaff]     = useState<UserType | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<UserType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  getAllUsers,
  });

  // Toggle active/inactive
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  // Delete staff
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setShowAddModal(false);
    setEditStaff(null);
  };

  const users = data?.users ?? [];

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl space-y-6">

      {/* --- Section 1 — Company Details ----------------------------------------- */}
      <div className="bg-[#0D1526] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-6 h-6 rounded-full bg-[#E8A120] text-[#0A0F1E] text-xs font-bold flex items-center justify-center">1</span>
          <h3 className="text-white font-semibold">Company Details</h3>
        </div>

        {/* Read-only display — editable via .env */}
        <div className="space-y-3">
          {[
            { label: 'Company Name',       value: import.meta.env.VITE_COMPANY_NAME    ?? 'Leapback'                        },
            { label: 'Company Email',      value: import.meta.env.VITE_COMPANY_EMAIL   ?? 'info@leapback.ng'                },
            { label: 'Company Phone',      value: import.meta.env.VITE_COMPANY_PHONE   ?? '+234 800 000 0000'               },
            { label: 'Company Address',    value: import.meta.env.VITE_COMPANY_ADDRESS ?? 'Lagos, Nigeria'                  },
            { label: 'Bank',               value: import.meta.env.VITE_COMPANY_BANK    ?? 'GTBank'                          },
            { label: 'Account Number',     value: import.meta.env.VITE_COMPANY_ACCOUNT ?? '0123456789'                      },
            { label: 'Invoice Footer',     value: import.meta.env.VITE_INVOICE_FOOTER  ?? 'Thank you for your business.'    },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/40 text-sm">{label}</span>
              <span className="text-white text-sm">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs mt-4 flex items-center gap-1.5">
          <LockIcon size={11} />
          Company details are managed via the server environment file.
          Contact your developer to update these values.
        </p>
      </div>

      {/* ----- Section 2 — Staff Accounts ----------------------- */}
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

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrentUser = user.id === authUser?.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 bg-white/3 rounded-xl px-4 py-3"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${user.isActive
                      ? 'bg-[#E8A120]/10 text-[#E8A120]'
                      : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {getInitials(user.name)}
                  </div>

                  {/* Info */}
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

                  {/* Role */}
                  <span className="text-white/40 text-xs capitalize hidden md:block">
                    {user.userType}
                  </span>

                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0
                    ${user.isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">

                    {/* Edit */}
                    <button
                      onClick={() => setEditStaff(user)}
                      className="p-2 text-white/30 hover:text-[#E8A120] transition-colors rounded-lg hover:bg-[#E8A120]/5"
                      title="Edit staff member"
                    >
                      <PencilSimpleIcon size={15} />
                    </button>

                    {/* Toggle active — disabled for current user */}
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
                          ? <XCircleIcon    size={15} weight="fill" />
                          : <CheckCircleIcon size={15} weight="fill" />
                        }
                      </button>
                    )}

                    {/* Delete — disabled for current user */}
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

      {/* Modals  */}
      {showAddModal && (
        <AddStaffModal
          onSuccess={handleSuccess}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editStaff && (
        <EditStaffModal
          user={editStaff}
          onSuccess={handleSuccess}
          onClose={() => setEditStaff(null)}
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
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;