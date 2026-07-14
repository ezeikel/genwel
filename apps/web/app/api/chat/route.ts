import { models } from '@genwel/banking/models';
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { auth } from '@/auth';
import { buildChatTools } from '@/lib/ai/chat-tools';
import { getEntitlementsForUser } from '@/lib/entitlements';

export const maxDuration = 30;

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
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Ask Genwel is a Pro feature.
  const entitlements = await getEntitlementsForUser(session.user.id);
  if (!entitlements.features.askGenwel) {
    return new Response('Ask Genwel is a Pro feature', { status: 403 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: models.intelligent, // claude-sonnet-5
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // allow multi-step tool calls
    tools: buildChatTools(session.user.id),
  });

  return result.toUIMessageStreamResponse();
}
