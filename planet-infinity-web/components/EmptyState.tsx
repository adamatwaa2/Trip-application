import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  /** Say what is happening and what to do next. No "oops", no sad faces. */
  body: ReactNode;
  action?: ReactNode;
};

/**
 * PI-WB-002 Plate 10, QA item 11: empty, error and sold-out states are
 * written, never left as browser defaults.
 */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="pi-empty">
      <h3 className="pi-empty__title">{title}</h3>
      <p className="pi-empty__body">{body}</p>
      {action ? <div className="pi-empty__action">{action}</div> : null}
    </div>
  );
}
