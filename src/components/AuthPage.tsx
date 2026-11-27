import React, { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeMode } from '../types/finance';

interface AuthPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ theme, onToggleTheme }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else {
        await register({
          name: name.trim(),
          email: trimmedEmail,
          password,
          confirmPassword,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';

      if (
        /mongo|database|connection|network|fetch failed|server unavailable/i.test(
          errorMessage
        )
      ) {
        setError(
          "We're unable to process your request right now. Please try again later."
        );
      } else {
        setError(
          errorMessage ||
            'Authentication failed. Please check your credentials and try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#0B1410] text-[#181E1B] dark:text-[#F4F6F2] transition-colors duration-200">
      {/* Minimal Header */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#152A20]/8 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-[#152A20] dark:bg-[#C5A869] text-[#FAF8F5] dark:text-[#0B1410] flex items-center justify-center font-editorial font-semibold text-base">
            A
          </span>
          <span className="font-editorial text-xl font-medium tracking-tight text-[#152A20] dark:text-[#F4F6F2]">
            Auryx
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="w-10 h-10 rounded-lg border border-[#D8CEBC] dark:border-[#C5A869]/25 bg-white dark:bg-[#15241C] text-[#152A20] dark:text-[#C5A869] flex items-center justify-center hover:border-[#C5A869] transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Editorial Split */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Editorial Brand Panel (7 cols on desktop) */}
          <section className="lg:col-span-6 rounded-xl bg-[#152A20] dark:bg-[#15241C] text-[#FAF8F5] border border-[#C5A869]/35 p-8 sm:p-10 flex flex-col justify-between shadow-heritage">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-[#C5A869]">
                Your Money. Your Intelligence.
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-normal leading-tight text-white mt-3 text-balance">
                Private financial clarity designed for Indian students and young adults.
              </h1>
              <p className="text-sm text-[#D0E8D9] dark:text-[#D0C5B5] leading-relaxed mt-4">
                Track daily rupee expenses with natural language, calibrate monthly category budgets, monitor savings goals, and test affordability decisions before spending.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/12 space-y-3 text-xs text-[#D0E8D9] dark:text-[#8BA393]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                <span>
                  Every account has its own private ledger, budgets, and savings goals stored securely.
                </span>
              </div>
              <p className="text-[#C5A869]">
                New accounts start completely fresh — ready for your own budget and first transaction.
              </p>
            </div>
          </section>

          {/* Right Auth Form Card (6 cols) */}
          <section className="lg:col-span-6 rounded-xl bg-white dark:bg-[#101C16] border border-[#152A20]/10 dark:border-white/8 p-7 sm:p-9 shadow-heritage flex flex-col justify-center">
            {/* Segmented Mode Switch */}
            <div className="inline-flex p-1 rounded-lg bg-[#EFF5F0] dark:bg-[#15241C] border border-[#152A20]/8 dark:border-white/8 self-start mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`px-4 py-2 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#0B1410] text-[#152A20] dark:text-[#C5A869]'
                    : 'text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`px-4 py-2 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#0B1410] text-[#152A20] dark:text-[#C5A869]'
                    : 'text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2]'
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="font-editorial text-2xl font-medium text-[#152A20] dark:text-[#F4F6F2]">
              {mode === 'login' ? 'Sign in to Auryx' : 'Create your Auryx account'}
            </h2>
            <p className="text-xs text-[#69706B] dark:text-[#8BA393] mt-1">
              {mode === 'login'
                ? 'Access your personal ledger, category budgets, and savings goals.'
                : 'Set up your personal financial workspace in seconds.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-lg bg-[#FFDAD6] dark:bg-[#93000A]/40 text-[#93000A] dark:text-[#FFB4AB] text-xs font-medium"
                >
                  {error}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g., Ananya Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 text-[#69706B] dark:text-[#8BA393] hover:text-[#152A20] dark:hover:text-[#F4F6F2]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-semibold text-[#424844] dark:text-[#D0C5B5] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#15241C] border border-[#D8CEBC] dark:border-white/12 text-sm text-[#181E1B] dark:text-[#F4F6F2] focus:outline-none focus:border-[#C5A869] focus:ring-2 focus:ring-[#C5A869]/20"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#152A20] hover:bg-[#224A38] disabled:opacity-55 text-white dark:bg-[#C5A869] dark:hover:bg-[#D8BF84] dark:text-[#0B1410] text-sm font-semibold border border-[#C5A869]/30 transition-colors"
              >
                <span>
                  {isSubmitting
                    ? mode === 'login'
                      ? 'Signing In...'
                      : 'Creating Account...'
                    : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};
