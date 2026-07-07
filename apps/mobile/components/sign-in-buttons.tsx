import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faApple,
  faFacebookF,
  faGoogle,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { toast } from 'sonner-native';
import { API_BASE } from '@/lib/api';
import { useSession } from '@/lib/session';

// Icon + label row for a provider button (icon left, label centred) — matches
// the web sign-in surface and keeps the buttons visually consistent.
const ProviderLabel = ({
  icon,
  color,
  label,
  className,
}: {
  icon: IconProp;
  color: string;
  label: string;
  className: string;
}) => (
  <View className="flex-row items-center justify-center gap-3">
    <FontAwesomeIcon icon={icon} size={18} color={color} />
    <Text className={className}>{label}</Text>
  </View>
);

// Real sign-in for the entry screen. Runs the NATIVE Apple / Google flow to get a
// provider token, then hands it to useSession().signIn — which POSTs to
// /api/auth/mobile/{apple,google} and hydrates /me. Magic-link sends an email;
// the link deep-links back to genwel://magic-link. Genwel is account-based:
// nothing to show until you're signed in (it aggregates YOUR accounts).

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const facebookEnabled = !!process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

const isCancel = (err: unknown): boolean => {
  const code = (err as { code?: string })?.code ?? '';
  const message = (err as { message?: string })?.message ?? '';
  return (
    code === 'SIGN_IN_CANCELLED' ||
    code === '-5' ||
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'ERR_CANCELED' ||
    /cancel/i.test(message)
  );
};

type Props = { onSignedIn?: () => void };

export const SignInButtons = ({ onSignedIn }: Props) => {
  const signIn = useSession((s) => s.signIn);
  const [busy, setBusy] = useState<null | string>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (googleWebClientId) {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        iosClientId: googleIosClientId,
      });
    }
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  const onGoogle = async () => {
    setBusy('google');
    try {
      await GoogleSignin.hasPlayServices();
      const info = await GoogleSignin.signIn();
      const idToken = info.data?.idToken;
      if (!idToken) throw new Error('no id token');
      await signIn({ kind: 'google', idToken });
      onSignedIn?.();
    } catch (err) {
      if (!isCancel(err)) toast.error("Couldn't sign in with Google.");
    } finally {
      setBusy(null);
    }
  };

  const onApple = async () => {
    setBusy('apple');
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!cred.identityToken) throw new Error('no identity token');
      await signIn({ kind: 'apple', identityToken: cred.identityToken });
      onSignedIn?.();
    } catch (err) {
      if (!isCancel(err)) toast.error("Couldn't sign in with Apple.");
    } finally {
      setBusy(null);
    }
  };

  const onFacebook = async () => {
    setBusy('facebook');
    try {
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
      ]);
      if (result.isCancelled) return;
      const token = await AccessToken.getCurrentAccessToken();
      if (!token?.accessToken) throw new Error('no access token');
      await signIn({ kind: 'facebook', accessToken: token.accessToken });
      onSignedIn?.();
    } catch (err) {
      if (!isCancel(err)) toast.error("Couldn't sign in with Facebook.");
    } finally {
      setBusy(null);
    }
  };

  const onMagicLink = async () => {
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setBusy('magic');
    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error('send failed');
      setSent(true);
    } catch {
      toast.error("Couldn't send the link. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (sent) {
    return (
      <View className="items-center gap-2 py-2">
        <Text className="text-center text-[15px] font-semibold text-neutral-900">
          Check your email
        </Text>
        <Text className="text-center text-[13px] text-neutral-500">
          We sent a sign-in link to {email.trim()}. Tap it to finish.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {Platform.OS === 'ios' && appleAvailable ? (
        <Pressable
          onPress={busy ? undefined : onApple}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          className={`items-center rounded-2xl bg-neutral-900 px-6 py-4 ${busy ? 'opacity-50' : 'active:opacity-90'}`}
        >
          <ProviderLabel
            icon={faApple}
            color="#ffffff"
            label="Continue with Apple"
            className="text-[15px] font-semibold text-white"
          />
        </Pressable>
      ) : null}

      {googleWebClientId ? (
        <Pressable
          onPress={busy ? undefined : onGoogle}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          className={`items-center rounded-2xl border border-neutral-300 px-6 py-4 ${busy ? 'opacity-50' : 'active:bg-neutral-50'}`}
        >
          <ProviderLabel
            icon={faGoogle}
            color="#EA4335"
            label="Continue with Google"
            className="text-[15px] font-semibold text-neutral-900"
          />
        </Pressable>
      ) : null}

      {facebookEnabled ? (
        <Pressable
          onPress={busy ? undefined : onFacebook}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          className={`items-center rounded-2xl border border-neutral-300 px-6 py-4 ${busy ? 'opacity-50' : 'active:bg-neutral-50'}`}
        >
          <ProviderLabel
            icon={faFacebookF}
            color="#1877F2"
            label="Continue with Facebook"
            className="text-[15px] font-semibold text-neutral-900"
          />
        </Pressable>
      ) : null}

      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-neutral-200" />
        <Text className="text-[12px] text-neutral-400">or</Text>
        <View className="h-px flex-1 bg-neutral-200" />
      </View>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        placeholderTextColor="#a3a3a3"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[15px] text-neutral-900"
      />
      <Pressable
        onPress={busy === 'magic' ? undefined : onMagicLink}
        disabled={busy === 'magic'}
        accessibilityRole="button"
        accessibilityLabel="Email me a sign-in link"
        className={`items-center rounded-2xl px-6 py-4 ${busy === 'magic' ? 'bg-neutral-400' : 'bg-neutral-900 active:opacity-90'}`}
      >
        <ProviderLabel
          icon={faEnvelope}
          color="#ffffff"
          label={busy === 'magic' ? 'Sending…' : 'Email me a link'}
          className="text-[15px] font-semibold text-white"
        />
      </Pressable>
    </View>
  );
};

export default SignInButtons;
