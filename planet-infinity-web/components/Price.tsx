/**
 * Price — Clash, tabular, always with the currency and the unit
 * (PI-WB-002, Plate 06). Western Arabic digits, always.
 *
 * When no price is set, this renders the "price not set" marker rather than a
 * number. It never shows 0, "TBA", "from", or a guess.
 */
import { Placeholder } from "./Placeholder";
import type { PlaceholderId } from "@/content/placeholders";

type PriceProps = {
  egp?: number;
  /** e.g. "per person", "per seat", "per ticket". */
  unit?: string;
  size?: "default" | "large";
  /** Which unknown this price belongs to, when no value is set. */
  placeholderId?: PlaceholderId;
};

export function Price({
  egp,
  unit,
  size = "default",
  placeholderId = "pricePerSeat",
}: PriceProps) {
  if (egp === undefined) {
    return (
      <span className={`pi-price pi-price--${size}`}>
        <Placeholder id={placeholderId} label="Price not set" />
      </span>
    );
  }

  return (
    <span className={`pi-price pi-price--${size}`}>
      <span className="pi-price__amount">{egp.toLocaleString("en-US")}</span>
      <span className="pi-price__currency">EGP</span>
      {unit ? <span className="pi-price__unit">{unit}</span> : null}
    </span>
  );
}
