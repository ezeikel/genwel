// Re-export the Prisma client (lazy proxy — safe to import without env)
export { getDb, isDatabaseConfigured, prisma as db } from './client';
// Re-export specific model types with Db prefix for convenience
export type {
  Account as DbAccount,
  AiInsight as DbAiInsight,
  BankAccount as DbBankAccount,
  BankConnection as DbBankConnection,
  Budget as DbBudget,
  BudgetConfig as DbBudgetConfig,
  Session as DbSession,
  Transaction as DbTransaction,
  User as DbUser,
  VerificationToken as DbVerificationToken,
} from './generated/prisma/client';
// Re-export everything from Prisma client
export * from './generated/prisma/client';
// Re-export Prisma namespace separately for explicit access
// Re-export enums
export {
  BudgetPeriodType,
  Prisma,
  SpendingCategory,
} from './generated/prisma/client';
