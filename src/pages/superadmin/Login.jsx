import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import { superadminService } from '../../services/superadmin.service';
import { toast } from '../../store/useToastStore';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await superadminService.login(form);
      setAuth(res.data.token, res.data.admin, 'superadmin');
      toast.success('Welcome, Super Admin!');
      navigate('/superadmin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FeeSync</h1>
          <p className="text-sm text-gray-500 mt-1">Super Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to continue</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="superadmin@feesync.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              required
            />
            <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          School admin?{' '}
          <a href="/" className="text-brand-600 hover:underline font-medium">
            Go to Admin Portal
          </a>
        </p>
      </div>
    </div>
  );
}
