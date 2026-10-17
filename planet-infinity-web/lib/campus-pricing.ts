export type PercentTier = { from: number; percent: number };
export type PriceTier = { from: number; price: number };
export type EventQuote = {
  id: string; expiresAt: string; quantity: number; code: string | null;
  lines: { quantity: number; price: number }[]; originalSubtotal: number;
  discountPercent: number; discountEgp: number; fees: number; total: number;
  discountTiers: PercentTier[]; universityAdmission: boolean;
};
export const PREVIEW_DISCOUNTS: PercentTier[] = [{from:1,percent:5},{from:5,percent:10},{from:10,percent:20},{from:15,percent:30}];
export function nextDiscount(tiers: PercentTier[], quantity: number) {
  return tiers.find(t => t.from > quantity);
}
export function previewQuote(quantity: number, code: string, unitPrice: number, fee: number): EventQuote {
  const percent = code ? PREVIEW_DISCOUNTS.findLast(t => t.from <= quantity)?.percent ?? 0 : 0;
  const subtotal = unitPrice * quantity;
  const discount = Math.round(subtotal * percent) / 100;
  return {id:"preview",expiresAt:new Date(Date.now()+1200000).toISOString(),quantity,code:code||null,lines:[{quantity,price:unitPrice}],originalSubtotal:subtotal,discountPercent:percent,discountEgp:discount,fees:fee*quantity,total:subtotal-discount+fee*quantity,discountTiers:PREVIEW_DISCOUNTS,universityAdmission:Boolean(code)};
}
