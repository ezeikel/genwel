import { useChat } from '@ai-sdk/react';
import {
  faArrowUp,
  faEllipsis,
  faSpinner,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GenwelMark } from '@/components/Logo';
import { MoreSheet } from '@/components/MoreSheet';
import { ProGate } from '@/components/ProGate';
import { IconButton, PageHeader } from '@/components/ui';
import { API_BASE } from '@/lib/api';
import { useSession } from '@/lib/session';

const SUGGESTIONS = [
  'How much did I spend on eating out this month?',
  'What are my subscriptions costing me?',
  'Where could I make more room?',
  'What is my current net worth?',
];

const messageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === 'text')
    .map((part) => ('text' in part ? part.text : ''))
    .join('');

const MessageBubble = ({ message }: { message: UIMessage }) => {
  const text = messageText(message);
  const isUser = message.role === 'user';
  const checking =
    !isUser &&
    !text &&
    message.parts.some((part) => part.type.startsWith('tool-'));
  if (!text && !checking) return null;
  return (
    <View
      className={`mb-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[86%] rounded-3xl px-4 py-3 ${
          isUser
            ? 'rounded-br-lg bg-primary'
            : 'rounded-bl-lg border border-border bg-card'
        }`}
      >
        {checking ? (
          <View className="flex-row items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} size={13} color="#667a78" />
            <Text className="font-sans text-[13px] text-muted-foreground">
              Checking your accounts…
            </Text>
          </View>
        ) : (
          <Text
            selectable
            className={`font-sans text-[14px] leading-[21px] ${
              isUser ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {text}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function AskTab() {
  const token = useSession((state) => state.token);
  const isPro = useSession(
    (state) => state.entitlements?.features.askGenwel ?? false,
  );
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<UIMessage>>(null);
  const [input, setInput] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_BASE}/api/chat`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    [token],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput('');
    void sendMessage({ text: value });
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );
  };

  const empty = (
    <View className="flex-1 items-center justify-center px-4 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-muted">
        <GenwelMark size={34} />
      </View>
      <Text className="mt-5 text-center font-sans-bold text-[20px] text-foreground">
        Ask about your own money
      </Text>
      <Text className="mt-2 max-w-sm text-center font-sans text-[13px] leading-5 text-muted-foreground">
        Genwel can look across your balances, spending and recurring payments
        before answering.
      </Text>
      <View className="mt-6 w-full gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => send(suggestion)}
            className="rounded-2xl border border-border bg-card px-4 py-3.5 active:bg-muted"
          >
            <Text className="font-sans-medium text-[12px] leading-4 text-foreground">
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 1, backgroundColor: '#faf9f7' }}
      >
        <View className="px-5">
          <PageHeader
            title="Ask Genwel"
            subtitle="Plain answers grounded in your connected accounts."
            action={
              <IconButton
                icon={faEllipsis}
                label="More"
                onPress={() => setMoreOpen(true)}
              />
            }
          />
        </View>

        {!isPro ? (
          <View className="px-5">
            <ProGate
              title="A conversation with your numbers"
              body="Ask Genwel to compare spending, check recurring costs or explain changes across your accounts."
            />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              ListEmptyComponent={empty}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 20,
                paddingBottom: 12,
              }}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
            />

            {busy && messages.at(-1)?.role === 'user' ? (
              <View className="mb-2 ml-5 h-10 w-12 items-center justify-center rounded-2xl border border-border bg-card">
                <FontAwesomeIcon icon={faSpinner} size={14} color="#667a78" />
              </View>
            ) : null}
            {error ? (
              <Text className="mb-2 px-6 text-center font-sans text-[11px] text-destructive">
                {error.message || 'That answer could not be completed.'}
              </Text>
            ) : null}

            <View
              className="border-t border-border bg-background px-5 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 8) + 84 }}
            >
              <View className="flex-row items-end gap-2 rounded-[26px] border border-border bg-card p-2 pl-4">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => send(input)}
                  placeholder="Ask about spending, bills, balances…"
                  placeholderTextColor="#80908e"
                  returnKeyType="send"
                  multiline
                  blurOnSubmit
                  maxLength={1_000}
                  className="max-h-28 min-h-11 flex-1 py-3 font-sans text-[14px] leading-5 text-foreground"
                />
                <Pressable
                  onPress={() => send(input)}
                  disabled={busy || !input.trim()}
                  accessibilityLabel="Send"
                  className={`h-11 w-11 items-center justify-center rounded-full bg-primary ${
                    busy || !input.trim() ? 'opacity-35' : ''
                  }`}
                >
                  <FontAwesomeIcon icon={faArrowUp} size={15} color="#faf9f7" />
                </Pressable>
              </View>
              <Text className="mt-2 text-center font-sans text-[9px] text-muted-foreground">
                General information only, not regulated financial advice.
              </Text>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
