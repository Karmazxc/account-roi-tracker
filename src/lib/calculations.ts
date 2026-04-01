/**
 * Calculates the split earnings for each participant based on their percentage.
 * @param totalEarnings - The total amount earned from a session.
 * @param shares - Map of user names and their percentage (e.g. { Mark: 0.50, Kram: 0.25, Krem: 0.25 })
 * @returns Map of user names and their calculated share amount.
 */
export function calculatePayouts(totalEarnings: number, shares: Record<string, number>) {
  const payouts: Record<string, number> = {};
  
  Object.entries(shares).forEach(([user, percentage]) => {
    payouts[user] = totalEarnings * percentage;
  });
  
  return payouts;
}

/**
 * Calculates the status of ROI for a given account.
 * @param purchasePrice - The initial price of the account.
 * @param totalEarnings - The accumulated earnings from this account.
 * @returns Total progress percentage and whether ROI is reached.
 */
export function calculateROI(purchasePrice: number, totalEarnings: number) {
  const progress = (totalEarnings / purchasePrice) * 100;
  const isReached = totalEarnings >= purchasePrice;
  
  return {
    progress: Math.min(progress, 100),
    isReached,
    remaining: isReached ? 0 : purchasePrice - totalEarnings
  };
}
