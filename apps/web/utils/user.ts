import { auth } from "@/auth";
import { db } from "@genwel/db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  return user;
}

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
