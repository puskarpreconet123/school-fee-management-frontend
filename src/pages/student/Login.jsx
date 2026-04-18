import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import { toast } from '../../store/useToastStore';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.identifier.trim()) e.identifier = 'Student ID, Email or phone is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.studentLogin(form);
      const { token, student } = res.data;
      setAuth(token, student, 'student');
      
      if (student.mustChangePassword) {
        toast.info('Please change your password to continue.');
        navigate('/student/change-password');
      } else {
        toast.success(`Welcome, ${student.name}!`);
        navigate('/student/dashboard');
      }
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
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FeeSync</h1>
          <p className="text-sm text-gray-500 mt-1">Student Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Student ID, Email or Phone"
              type="text"
              placeholder="e.g. STU-202604-00001 or you@school.edu"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              error={errors.identifier}
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
              helper="Contact your school admin if you haven't set a password."
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

        {/* Quick Pay CTA */}
        <div className="mt-8 text-center bg-brand-50 border border-brand-100 rounded-xl p-4">
          <p className="text-sm text-gray-700 font-medium mb-2">Want to pay fees without logging in?</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/pay')} className="bg-white">
            Use Quick Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
