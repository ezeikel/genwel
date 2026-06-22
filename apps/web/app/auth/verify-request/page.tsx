import { faEnvelope } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export const metadata = {
  title: 'Check your email - Genwel',
  description: 'We sent you a magic link to sign in',
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="w-8 h-8 text-gray-600"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>

          <p className="text-gray-600 mb-6">
            We&apos;ve sent you a magic link to sign in.
            <br />
            Click the link in your email to continue.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">
              The link expires in <strong>15 minutes</strong>
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email?{' '}
            <Link
              href="/signin"
              className="text-black underline hover:no-underline"
            >
              Try again
            </Link>
          </p>
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
