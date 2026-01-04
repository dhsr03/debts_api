export const cacheKeys = {
  userDebts: (userId: string, status: string) => `debts:user:${userId}:status:${status}`,
  debtById: (debtId: string) => `debt:${debtId}`,
  summary: (userId: string) => `debts:summary:user:${userId}`,
};
