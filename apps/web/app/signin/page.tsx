import { configuredProviders } from '@/auth';
import SignInForm from './SignInForm';

export default function SignInPage() {
  return <SignInForm providers={configuredProviders} />;
}
