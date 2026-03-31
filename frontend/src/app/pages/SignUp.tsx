import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';

// ─── Password strength ──────────────────────────────────────────────────────
const getStrength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { label: 'Weak',   barWidth: 'w-1/4', barColor: 'bg-red-500',     textColor: 'text-red-500'     };
  if (s <= 3) return { label: 'Medium', barWidth: 'w-3/5', barColor: 'bg-amber-500',   textColor: 'text-amber-500'   };
  return              { label: 'Strong', barWidth: 'w-full', barColor: 'bg-emerald-500', textColor: 'text-emerald-500' };
};

export function SignUp() {
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [phone, setPhone]               = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const str = getStrength(password);
    if (str.label === 'Weak')           { toast.error('Password too weak. Add uppercase, number & symbol.'); return; }
    if (!/^\d{10}$/.test(phone))        { toast.error('Phone must be exactly 10 digits'); return; }
    setLoading(true);
    try {
      await signup(name, email, password, phone);
      const role = localStorage.getItem('role');
      toast.success('Account created!');
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'RECRUITER') navigate('/recruiter');
      else navigate('/candidate');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = password ? getStrength(password) : null;

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

  const fields = [
    { id: 'name',  label: 'Full Name',      Icon: User,  type: 'text',  value: name,  setter: setName,  placeholder: 'Jane Smith'       },
    { id: 'email', label: 'Email Address',  Icon: Mail,  type: 'email', value: email, setter: setEmail, placeholder: 'you@company.com'  },
    { id: 'phone', label: 'Phone Number',   Icon: Phone, type: 'tel',   value: phone, setter: setPhone, placeholder: '10-digit number'  },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center md:p-4 bg-[linear-gradient(145deg,#f8fafc_0%,#eef2ff_50%,#f1f5f9_100%)]">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_65%)]" />
        <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_65%)]" />
      </div>

      <div className="w-full max-w-[480px] relative">

      

        {/* Card */}
        <div className="bg-white rounded-[20px] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">

          <div className="mb-7">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-[-0.4px] mb-1.5">Create your account</h1>
            <p className="text-sm text-slate-500">Join HireFlow to start your journey</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Regular fields */}
            {fields.map(({ id, label, Icon, type, value, setter, placeholder }) => (
              <div key={id} className="mb-6">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.07em] mb-2.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon className={iconClass(id)} />
                  <input
                    type={type}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    required
                    inputMode={id === 'phone' ? 'numeric' : undefined}
                    className={inputClass(id)}
                    onFocus={() => setFocusedField(id)}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            ))}

            {/* Password field */}
            <div className="mb-7">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.07em] mb-2.5">
                Password
              </label>
              <div className="relative">
                <Lock className={iconClass('password')} />
                <input
                  type={'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className={`${inputClass('password')} !pr-9`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="mt-2.5">
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.barWidth} ${strength.barColor}`} />
                  </div>
                  <p className={`text-[11px] font-semibold mt-1 ${strength.textColor}`}>
                    {strength.label} password
                  </p>
                </div>
              )}
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
                  Creating account...
                </>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-500 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="bg-transparent border-0 cursor-pointer text-indigo-600 font-semibold text-[13px] p-0 hover:text-indigo-700 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          © {new Date().getFullYear()} HireFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
