// RevenueCat SDK removed for v1.0 submission (no IAP in this version)
// Re-add for v1.1 when paywall goes live

export function configureRevenueCat(): void {
  // no-op
}

export async function checkEntitlement(): Promise<boolean> {
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  return false;
}
