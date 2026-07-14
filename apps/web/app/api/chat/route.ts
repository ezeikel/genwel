import { models } from '@genwel/banking/models';
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { auth } from '@/auth';
import { buildChatTools } from '@/lib/ai/chat-tools';
import { getUserIdFromToken } from '@/lib/auth-mobile';
import { getEntitlementsForUser } from '@/lib/entitlements';

export const maxDuration = 30;

const MAX_BODY_BYTES = 100_000;
const MAX_MESSAGES = 100;

const SYSTEM_PROMPT = `You are Ask Genwel, a calm, plain-spoken UK money assistant inside the Genwel budgeting app. You help the user understand their own money.

How you work:
- Answer from the user's REAL data. Use the tools (getBalances, getSpending, getSubscriptions, getFixableProblems) to look things up before answering anything specific about their finances. Do not invent numbers.
- Be concise and direct. Lead with the answer, then a short bit of context if useful.
- British English (£, "favourite"). No emoji, no exclamation marks.
- Supportive and non-judgemental, never preachy.

Boundaries:
- This is general information, NOT regulated financial advice. Do not recommend specific financial products, shares, or funds as "the right choice". For decisions with real risk (investing, pensions, debt solutions, mortgages), gently suggest speaking to a regulated adviser or a free service like MoneyHelper or Citizens Advice.
- If asked something you have no data for, say so plainly rather than guessing.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? (await getUserIdFromToken());
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Ask Genwel is a Pro feature.
  const entitlements = await getEntitlementsForUser(userId);
  if (!entitlements.features.askGenwel) {
    return new Response('Ask Genwel is a Pro feature', { status: 403 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response('Request too large', { status: 413 });
  }

  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return new Response('Request too large', { status: 413 });
  }

  let body: { messages?: unknown };
  try {
    body = JSON.parse(rawBody) as { messages?: unknown };
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > MAX_MESSAGES ||
    body.messages.some(
      (message) =>
        !message ||
        typeof message !== 'object' ||
        !('role' in message) ||
        !['user', 'assistant'].includes(String(message.role)) ||
        !('parts' in message) ||
        !Array.isArray(message.parts),
    )
  ) {
    return new Response('Invalid messages', { status: 400 });
  }
  const messages = body.messages as UIMessage[];

  const result = streamText({
    model: models.intelligent, // claude-sonnet-5
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // allow multi-step tool calls
    tools: buildChatTools(userId),
  });

  return result.toUIMessageStreamResponse();
}
