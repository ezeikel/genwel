import { faTriangleExclamation } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export const metadata = {
  title: 'Sign-in problem - Genwel',
  description: 'Something went wrong signing you in',
};

// NextAuth error codes we surface with tailored copy; everything else is generic.
// `Verification` = an expired or already-used magic link.
const MESSAGES: Record<string, string> = {
  Verification:
    'That sign-in link is invalid or has expired. Request a fresh one and try again.',
  Configuration:
    'Sign-in is temporarily unavailable. Please try again in a little while.',
  AccessDenied: 'You do not have access with that account.',
  OAuthAccountNotLinked:
    'That email is already linked to a different sign-in method. Use the one you signed up with.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ??
    'Something went wrong signing you in. Please try again.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="w-8 h-8 text-red-500"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign-in problem
          </h1>

          <p className="text-gray-600 mb-6">{message}</p>

          <Link
            href="/signin"
            className="inline-block bg-black text-white py-2.5 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to sign in
          </Link>
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
