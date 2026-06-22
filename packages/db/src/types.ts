// Types-only exports that don't import the database client
// This file is safe to import in Edge Runtime and client side
// Re-export only types from the main index (no runtime code)
export type {
  Account as DbAccount,
  BankAccount as DbBankAccount,
  BankConnection as DbBankConnection,
  Prisma,
  Session as DbSession,
  Transaction as DbTransaction,
  User as DbUser,
  VerificationToken as DbVerificationToken,
} from './generated/prisma';
