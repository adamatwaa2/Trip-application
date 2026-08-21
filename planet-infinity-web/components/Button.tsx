import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * PI-WB-002, Plate 06.
 *   primary   G-01 gradient, ivory label, weight 800, 56px desktop / 48px mobile
 *   secondary ink outline — never a second gradient
 *   tertiary  text link with an ember underline
 *   danger    flame outline, destructive actions only (cancel, delete, refund)
 *
 * Labels come from the locked lexicon in content/cta.ts. If a button cannot
 * say what happens when it is pressed, the flow is wrong, not the label.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "default" | "large";

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

function buttonClass({ variant = "primary", size = "default", className }: StyleProps) {
  return [
    "pi-btn",
    `pi-btn--${variant}`,
    size === "large" ? "pi-btn--large" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonLinkProps = StyleProps & {
  href: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className" | "children">;

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  ...anchorProps
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClass({ variant, size, className })}
      {...anchorProps}
    >
      {children}
    </Link>
  );
}

type ButtonProps = StyleProps & {
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function Button({
  children,
  variant,
  size,
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
