import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';

export function SignIn() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [demoLoading, setDemoLoading]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your credentials'); return; }
    setLoading(true);
    try {
      await login(email, password);
      const role = localStorage.getItem('role');
      toast.success('Welcome back!');
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'RECRUITER') navigate('/recruiter');
      else navigate('/candidate');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Demo login — credentials never touch the input fields ──────────────────
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await login('admin@ats.com', 'Admin@123');
      toast.success('Signed in as Admin — explore freely!');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full text-sm text-slate-900 outline-none transition-all duration-[180ms] ${
      focusedField === field
        ? 'pl-9 pr-3 py-2.5 border border-indigo-500 rounded-lg bg-[#f8f9ff]'
        : 'pl-6 pr-3 py-2.5 border-0 border-b-2 border-slate-300 rounded-none bg-transparent'
    }`;

  const iconClass = (field: string) =>
    `absolute top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none transition-all duration-[180ms] ${
      focusedField === field ? 'left-[10px] text-indigo-500' : 'left-0 text-slate-400'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(145deg,#f8fafc_0%,#eef2ff_50%,#f1f5f9_100%)]">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_65%)]" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_65%)]" />
      </div>

      <div className="w-full max-w-[450px] relative">
        {/* Card */}
        <div className="bg-white rounded-[20px] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">

          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-[-0.4px] mb-1.5">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-7">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.07em] mb-2.5">
                Email address
              </label>
              <div className="relative">
                <Mail className={iconClass('email')} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className={inputClass('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-8">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.07em] mb-2.5">
                Password
              </label>
              <div className="relative">
                <Lock className={iconClass('password')} />
                <input
                type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputClass('password')} !pr-9`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-[13px] px-6 rounded-[10px] bg-gradient-to-br from-indigo-700 to-indigo-800 text-white text-sm font-semibold border-0 shadow-[0_4px_14px_rgba(79,70,229,0.3)] tracking-[0.01em] transition-all duration-150 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] hover:-translate-y-px ${
                loading ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* ── Demo access ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className={`w-full flex items-center justify-center gap-2 py-[11px] px-6 rounded-[10px] border border-dashed border-indigo-200 bg-indigo-50 text-indigo-600 text-sm font-semibold tracking-[0.01em] transition-all duration-150 hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-700 ${
              demoLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {demoLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Continue as Admin — Demo
              </>
            )}
          </button>
          {/* ───────────────────────────────────────────────────────────────── */}

          <p className="text-center text-[13px] text-slate-500 mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="bg-transparent border-0 cursor-pointer text-indigo-600 font-semibold text-[13px] p-0 hover:text-indigo-700 transition-colors"
            >
              Create one
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          © {new Date().getFullYear()} HireNest. All rights reserved.
        </p>
      </div>
    </div>
  );
}
