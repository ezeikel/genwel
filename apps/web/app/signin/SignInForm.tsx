'use client';

import {
  faApple,
  faFacebookF,
  faGoogle,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useAnalytics } from '@/utils/analytics-client';

type SignInFormProps = {
  providers: {
    google: boolean;
    apple: boolean;
    facebook: boolean;
    resend: boolean;
  };
};

export default function SignInForm({ providers }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { track } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    track('sign_in_started', { method: 'email' });

    try {
      await signIn('resend', {
        email,
        callbackUrl: '/dashboard',
      });
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'apple' | 'facebook') => {
    track('sign_in_started', { method: provider });
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gray-900">Genwel</h1>
            </Link>
            <p className="mt-2 text-gray-600">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="space-y-3">
            {providers.google && (
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 px-4 rounded-lg font-medium text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-[#EA4335]" />
                Continue with Google
              </button>
            )}

            {providers.apple && (
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faApple} />
                Continue with Apple
              </button>
            )}

            {providers.facebook && (
              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1877F2]/90 transition-colors"
              >
                <FontAwesomeIcon icon={faFacebookF} />
                Continue with Facebook
              </button>
            )}
          </div>

          {providers.resend && (
            <>
              <div className="flex items-center gap-3 my-6">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">
                  or continue with email
                </span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending magic link...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2.5">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email me a sign-in link
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  We&apos;ll send you a magic link to sign in.
                  <br />
                  No password required.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
