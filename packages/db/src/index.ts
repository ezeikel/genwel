// Re-export the Prisma client
export { prisma as db } from "./client";

// Re-export everything from Prisma client
export * from "./generated/prisma/client";

// Re-export Prisma namespace separately for explicit access
export { Prisma } from "./generated/prisma/client";

// Re-export specific model types with Db prefix for convenience
export type {
  User as DbUser,
  Account as DbAccount,
  Session as DbSession,
  VerificationToken as DbVerificationToken,
  BankConnection as DbBankConnection,
  BankAccount as DbBankAccount,
  Transaction as DbTransaction,
} from "./generated/prisma/client";
