import "server-only";

export type WhatsAppConfig = {
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  languageCode: string;
  confirmationTemplate: string;
};

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_GRAPH_VERSION &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_APP_SECRET &&
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
      process.env.WHATSAPP_CONFIRMATION_TEMPLATE,
  );
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const config = {
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US",
    confirmationTemplate: process.env.WHATSAPP_CONFIRMATION_TEMPLATE ?? "",
  };
  if (!isWhatsAppConfigured()) throw new Error("WhatsApp Business is not configured.");
  return config;
}
