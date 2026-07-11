export type AppClosingReason = 'none' | 'user-confirmed' | 'update-install';

export const sharedState = {
  closingReason: 'none' as AppClosingReason,
};
