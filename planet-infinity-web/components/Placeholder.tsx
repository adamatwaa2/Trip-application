import {
  PLACEHOLDERS,
  type PlaceholderEntry,
  type PlaceholderId,
} from "@/content/placeholders";

type PlaceholderProps = {
  id: PlaceholderId;
  /** Override the marker text. Rarely needed — the label usually reads fine. */
  label?: string;
};

/**
 * Renders unknown business data as an unmissable marker, or the real value
 * once content/placeholders.ts has one.
 *
 * Never render an invented price, date, contact or reference. If a value is
 * not in placeholders.ts and not supplied by Adam, it does not go on the page.
 */
export function Placeholder({ id, label }: PlaceholderProps) {
  const entry: PlaceholderEntry = PLACEHOLDERS[id];

  if (entry.value !== null) {
    return <>{entry.value}</>;
  }

  return (
    <span
      className="pi-placeholder"
      data-placeholder={id}
      title={entry.note ?? "Awaiting real information"}
    >
      {label ?? entry.label}
    </span>
  );
}
