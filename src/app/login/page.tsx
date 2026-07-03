'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToastProvider } from '@/components/ui/ToastProvider';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If session exists immediately, email confirmation is disabled — go to dashboard
        if (data.session) {
          window.location.href = '/dashboard';
          return;
        }
        toast.success('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and click the confirmation link first.');
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Incorrect email or password. Try signing up if you don\'t have an account.');
          } else {
            throw error;
          }
          return;
        }
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@neverexpire.app',
        password: 'demo123456',
      });
      if (error) {
        // Try signing up demo account
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@neverexpire.app',
          password: 'demo123456',
        });
        if (signUpError) throw signUpError;
        // Try login again
        await supabase.auth.signInWithPassword({
          email: 'demo@neverexpire.app',
          password: 'demo123456',
        });
      }
      window.location.href = '/dashboard';
    } catch {
      toast.error('Demo login failed. Please create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 70%)' }}>
      <ToastProvider />
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-md bg-brand-500/20 border border-brand-500/30 mb-4">
            <ShieldCheck className="h-7 w-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">NeverExpire</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enterprise document expiry tracking
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              id="login-email"
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="w-full rounded-sm px-3.5 py-2.5 pr-10 text-sm bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" style={{ marginTop: '8px' }} loading={loading}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-slate-500" style={{ background: '#1a1a2e' }}>or</span>
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleDemoLogin} loading={loading} id="demo-login-btn">
            🚀 Try Demo (Pre-loaded data)
          </Button>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Built for Wooble Expiry Alert &apos;26 Challenge
        </p>
      </div>
    </div>
  );
}
