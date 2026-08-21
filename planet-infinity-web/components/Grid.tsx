import type { ReactNode } from "react";

type GridProps = {
  children: ReactNode;
  /** Desktop column count. Collapses to 2 on tablet and 1 on mobile. */
  columns?: 2 | 3 | 4;
  className?: string;
};

/** Responsive grid on the brand's 24px gutter. */
export function Grid({ children, columns = 3, className }: GridProps) {
  return (
    <div
      className={["pi-grid", `pi-grid--${columns}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
