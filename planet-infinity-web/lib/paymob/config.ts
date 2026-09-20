import "server-only";

export type PaymobConfig = {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  hmacSecret: string;
  cardIntegrationId: number;
  walletIntegrationId: number | null;
};

export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_SECRET_KEY &&
      process.env.PAYMOB_PUBLIC_KEY &&
      process.env.PAYMOB_HMAC_SECRET &&
      process.env.PAYMOB_INTEGRATION_ID_CARD
  );
}

export function getPaymobConfig(): PaymobConfig {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const cardIntegrationId = Number(process.env.PAYMOB_INTEGRATION_ID_CARD);
  const walletIntegrationId = process.env.PAYMOB_INTEGRATION_ID_WALLET
    ? Number(process.env.PAYMOB_INTEGRATION_ID_WALLET)
    : null;
  const baseUrl = (process.env.PAYMOB_BASE_URL || "https://accept.paymob.com").replace(/\/$/, "");

  if (!secretKey || !publicKey || !hmacSecret || !Number.isInteger(cardIntegrationId) || cardIntegrationId < 1) {
    throw new Error("Paymob server credentials are not configured.");
  }

  if (walletIntegrationId !== null && (!Number.isInteger(walletIntegrationId) || walletIntegrationId < 1)) {
    throw new Error("The optional Paymob wallet integration ID is invalid.");
  }

  return { baseUrl, secretKey, publicKey, hmacSecret, cardIntegrationId, walletIntegrationId };
}
