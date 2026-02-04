// Types-only exports that don't import the database client
// This file is safe to import in Edge Runtime and client side
// Re-export only types from the main index (no runtime code)
export type {
  User as DbUser,
  Account as DbAccount,
  Session as DbSession,
  VerificationToken as DbVerificationToken,
  BankConnection as DbBankConnection,
  BankAccount as DbBankAccount,
  Transaction as DbTransaction,
  Prisma,
} from "./generated/prisma";
