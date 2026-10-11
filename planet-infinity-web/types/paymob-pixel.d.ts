declare module "paymob-pixel";

type PaymobPixelOptions = {
  publicKey: string;
  clientSecret: string;
  paymentMethods: string[];
  elementId: string;
  disablePay?: boolean;
  showSaveCard?: boolean;
  forceSaveCard?: boolean;
  showPaymobLogo?: boolean;
  afterPaymentComplete?: () => void;
  customStyle?: Record<string, string>;
};

interface Window {
  Pixel?: new (options: PaymobPixelOptions) => unknown;
}
