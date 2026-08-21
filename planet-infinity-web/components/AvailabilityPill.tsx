import { AVAILABILITY, type AvailabilityState } from "@/content/cta";
import { Pill } from "./Pill";

/**
 * Four states, same words as the product database (PI-WB-002, Plate 06).
 * Never "Hurry!", never a countdown we cannot honour. Scarcity is gold
 * territory; sold out goes quiet and grey rather than red.
 *
 * Renders nothing when availability is unknown — an absent state is never
 * presented as "AVAILABLE".
 */
export function AvailabilityPill({ state }: { state?: AvailabilityState }) {
  if (!state) return null;

  const tone =
    state === "fewSpotsLeft" || state === "almostFull"
      ? "gold"
      : state === "soldOut"
        ? "quiet"
        : "neutral";

  return <Pill tone={tone}>{AVAILABILITY[state]}</Pill>;
}
