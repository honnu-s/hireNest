import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase } from 'lucide-react';
import { toast } from "sonner";

const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score === 2 || score === 3) return { label: "Medium", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
};
 
export function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const strength = getPasswordStrength(password);
    if (strength.label === "Weak") {
      toast.error("Password too weak. Use uppercase, number & symbol.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    try {
      await signup(name, email, password, phone);

      const role = localStorage.getItem('role');

      toast.success(`Signed up as ${role}`);

      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'RECRUITER') navigate('/recruiter');
      else navigate('/candidate');

    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to ATS</CardTitle>
            <CardDescription className="mt-2 text-bold">
              Sign up 
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-100"
              />
              {password.length > 0 && (
                <p className={`text-sm ${getPasswordStrength(password).color}`}>
                  Password strength: {getPasswordStrength(password).label}
                  <span className="block text-xs text-muted-foreground">
                    Use 8+ chars, uppercase, number & symbol
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
  id="phone"
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="XXXXXXXXXX"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  required
  className="bg-gray-100"
/>
            </div>

            <Button
              type="submit"
              className={`rounded-none w-full ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already signed up?{' '}
            <span
              onClick={() => navigate('/signin')}
              className="cursor-pointer underline text-primary hover:opacity-80"
            >
              Sign in
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
