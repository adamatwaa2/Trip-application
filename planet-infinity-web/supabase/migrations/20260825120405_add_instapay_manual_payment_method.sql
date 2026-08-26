-- Keep InstaPay as a manually verified payment method until a supported
-- provider webhook is connected. Only an admin can record these payments.

alter table public.payments
  drop constraint if exists payments_payment_method_check;

alter table public.payments
  add constraint payments_payment_method_check
  check (payment_method in (
    'cash',
    'bank_transfer',
    'instapay',
    'card_terminal',
    'paymob_card',
    'other'
  ));

comment on column public.payments.payment_method is
  'Payment channel. InstaPay and bank transfers are manually verified by an admin; Paymob is verified by webhook.';
