import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, GraduationCap } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { toast } from '../../store/useToastStore';

export default function AdminChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) e.newPassword = 'New password is required';
    else if (form.newPassword.length < 6) e.newPassword = 'Minimum 6 characters';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.patch('/admin/me/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      
      toast.success('Password updated successfully!');
      
      // Update local state to clear the flag
      updateUser({ mustChangePassword: false });
      
      // Wait a moment so user sees the success state
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-200 mb-6 rotate-3">
            <GraduationCap size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security Protocol</h2>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Your school administrator account password was recently reset. 
            Please create a new secure password to continue.
          </p>
        </div>

        <div className="bg-white py-8 px-10 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Temporary Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="The hex code provided by Super Admin"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              error={errors.currentPassword}
              required
              autoFocus
            />

            <div className="relative">
              <Input
                label="New Secure Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Choose a strong password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                error={errors.newPassword}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Verify your new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-brand-100"
                size="lg"
                loading={loading}
                icon={CheckCircle2}
              >
                Activate Account
              </Button>
            </div>
            
            <button
              type="button"
              onClick={logout}
              className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Sign out and complete later
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
            &copy; {new Date().getFullYear()} FeeSync Admin Security Layer
          </p>
        </div>
      </div>
    </div>
  );
}
