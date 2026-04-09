'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter.';
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = 'Password must contain at least one number.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError('');

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || data.message || 'Registration failed. Please try again.');
        return;
      }

      // Redirect to login with success indicator
      router.push('/login?registered=true');
    } catch {
      setServerError('An unexpected error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  })();

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Create an account</h2>
        <p className="text-slate-400 text-sm mt-1">Start managing your properties with AI</p>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            disabled={isLoading}
            className={`w-full rounded-lg border px-3 py-2.5 text-white placeholder-slate-500 text-sm outline-none bg-white/10 focus:ring-2 transition-colors disabled:opacity-50 ${
              fieldErrors.name
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={isLoading}
            className={`w-full rounded-lg border px-3 py-2.5 text-white placeholder-slate-500 text-sm outline-none bg-white/10 focus:ring-2 transition-colors disabled:opacity-50 ${
              fieldErrors.email
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-white placeholder-slate-500 text-sm outline-none bg-white/10 focus:ring-2 transition-colors disabled:opacity-50 ${
                fieldErrors.password
                  ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {/* Password strength bar */}
          {formData.password && passwordStrength && (
            <div className="space-y-1">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${passwordStrength.color} ${passwordStrength.width}`} />
              </div>
              <p className="text-xs text-slate-400">
                Strength: <span className="text-slate-300">{passwordStrength.label}</span>
              </p>
            </div>
          )}
          {fieldErrors.password && (
            <p className="text-xs text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-white placeholder-slate-500 text-sm outline-none bg-white/10 focus:ring-2 transition-colors disabled:opacity-50 ${
                fieldErrors.confirmPassword
                  ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                  : formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
                  : 'border-white/20 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
          )}
          {!fieldErrors.confirmPassword &&
            formData.confirmPassword &&
            formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-400">Passwords match ✓</p>
            )}
        </div>

        {/* Terms notice */}
        <p className="text-xs text-slate-500">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Spinner />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
