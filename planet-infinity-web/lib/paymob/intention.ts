import "server-only";

import type { PaymobConfig } from "./config";

export type PaymobIntentionInput = {
  amount: number;
  currency: "EGP";
  paymentMethods: number[];
  item: {
    name: string;
    description: string;
  };
  billingData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  specialReference: string;
  notificationUrl: string;
  redirectionUrl: string;
};

export type PaymobIntention = {
  id: string;
  clientSecret: string;
  orderId: string | null;
};

type PaymobIntentionResponse = {
  id?: string | number;
  client_secret?: string;
  intention_order_id?: string | number;
  detail?: string;
  message?: string;
};

export class PaymobIntentionError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "PaymobIntentionError";
  }
}

export async function createPaymobIntention(
  config: PaymobConfig,
  input: PaymobIntentionInput,
): Promise<PaymobIntention> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${config.baseUrl}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        payment_methods: input.paymentMethods,
        items: [{
          name: input.item.name,
          amount: input.amount,
          description: input.item.description,
          quantity: 1,
        }],
        billing_data: {
          first_name: input.billingData.firstName,
          last_name: input.billingData.lastName,
          email: input.billingData.email,
          phone_number: input.billingData.phoneNumber,
          apartment: "NA",
          floor: "NA",
          street: "NA",
          building: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "Cairo",
          country: "EG",
          state: "Cairo",
        },
        customer: {
          first_name: input.billingData.firstName,
          last_name: input.billingData.lastName,
          email: input.billingData.email,
        },
        special_reference: input.specialReference,
        notification_url: input.notificationUrl,
        redirection_url: input.redirectionUrl,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as PaymobIntentionResponse | null;
    if (!response.ok) {
      throw new PaymobIntentionError(
        payload?.detail || payload?.message || "Paymob rejected the payment request.",
        response.status,
      );
    }
    if (!payload?.id || !payload.client_secret) {
      throw new PaymobIntentionError("Paymob returned an incomplete payment response.", response.status);
    }

    return {
      id: String(payload.id),
      clientSecret: payload.client_secret,
      orderId: payload.intention_order_id ? String(payload.intention_order_id) : null,
    };
  } catch (error) {
    if (error instanceof PaymobIntentionError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new PaymobIntentionError("Paymob took too long to respond. Please try again.");
    }
    throw new PaymobIntentionError("Paymob could not be reached. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}
