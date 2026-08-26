import "server-only";

import { getWhatsAppConfig } from "./config";

type SendInput = {
  recipient: string;
  payload: Record<string, unknown>;
  documentUrl?: string;
};

function text(value: unknown, fallback = "-") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function recipient(value: string) {
  return value.replace(/\D/g, "");
}

export async function sendWhatsAppTemplate(input: SendInput): Promise<string> {
  const config = getWhatsAppConfig();
  const to = recipient(input.recipient);
  if (to.length < 8 || to.length > 15) throw new Error("Invalid international WhatsApp number.");

  const templateName = config.confirmationTemplate;
  const components: Record<string, unknown>[] = [];
  if (!input.documentUrl) throw new Error("The confirmation document is unavailable.");
  components.push({
    type: "header",
    parameters: [{
      type: "document",
      document: {
        link: input.documentUrl,
        filename: `Planet-Infinity-${text(input.payload.booking_number, "booking")}.pdf`,
      },
    }],
  });
  components.push({
    type: "body",
    parameters: [{ type: "text", text: text(input.payload.booking_number) }],
  });

  const response = await fetch(
    `https://graph.facebook.com/${encodeURIComponent(config.graphVersion)}/${encodeURIComponent(config.phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: config.languageCode },
          components,
        },
      }),
      cache: "no-store",
    },
  );
  const body = (await response.json().catch(() => null)) as
    | { messages?: { id?: string }[]; error?: { message?: string } }
    | null;
  const messageId = body?.messages?.[0]?.id;
  if (!response.ok || !messageId) {
    throw new Error(body?.error?.message || `WhatsApp API returned ${response.status}.`);
  }
  return messageId;
}
