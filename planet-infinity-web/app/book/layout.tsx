import type { Metadata } from "next";

/**
 * /book is a client component, so its metadata lives here. It is a standalone
 * preview of the seat map, not a universal booking destination — seat
 * selection belongs to the trips that enable it.
 */
export const metadata: Metadata = {
  title: "Seat selection preview",
  description:
    "A preview of the Planet Infinity seat map. Most trips do not use seat selection.",
};

export default function BookLayout({ children }: LayoutProps<"/book">) {
  return children;
}
