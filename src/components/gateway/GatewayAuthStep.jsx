import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StuviaBrandMark } from './StuviaBrandHeader';
import { STORAGE_KEYS } from '@/lib/stuviaInstitutions';

export default function GatewayAuthStep({ onAuthenticated }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password) {
        setError('Please fill in all fields to create your account.');
        return;
      }
      const userObj = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: cleanEmail,
      };
      const updated = [...accounts.filter(a => a.email !== cleanEmail), { ...userObj, password }];
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      onAuthenticated(userObj);
    } else {
      if (!cleanEmail || !password) {
        setError('Please enter your institutional email and password.');
        return;
      }
      const existing = accounts.find(a => a.email === cleanEmail);
      if (existing && existing.password && existing.password !== password) {
        setError('Incorrect password. Please try again.');
        return;
      }
      const userObj = existing || {
        first_name: cleanEmail.split('@')[0],
        last_name: '',
        full_name: cleanEmail.split('@')[0],
        email: cleanEmail,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      onAuthenticated(userObj);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <StuviaBrandMark />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {mode === 'signup' ? 'Create your Stuvia account' : 'Sign in to Stuvia'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {mode === 'signup'
            ? 'Pay departmental dues, get verified receipts, and connect with your campus association.'
            : 'Welcome back! Sign in to select your university and department.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs rounded-xl p-3 border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        {mode === 'signup' && (
          <>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name..."
                className="pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
              />
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name..."
                className="pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Institutional Email..."
            className="pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
          />
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password..."
            className="pl-10 pr-10 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-sm italic placeholder:italic"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-900/10 mt-2"
        >
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </Button>
      </form>

      <div className="mt-5 text-center space-y-3">
        <p className="text-xs text-gray-400">
          By continuing, you agree to Stuvia's{' '}
          <span className="text-amber-600 font-semibold">Terms of Use</span> and{' '}
          <span className="text-amber-600 font-semibold">Privacy Policy</span>
        </p>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-amber-600 font-semibold hover:underline"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-amber-600 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => onAuthenticated({ full_name: 'Student', email: '' })}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
          >
            Skip to Select University →
          </button>
        </div>
      </div>
    </div>
  );
}