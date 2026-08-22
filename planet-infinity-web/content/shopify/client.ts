/**
 * Planet Infinity — Shopify read layer.
 *
 * ── READ-ONLY BY CONSTRUCTION ────────────────────────────────────────────
 * There is no mutation in this module and no path to one. It can only read.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── STATUS: WIRED, WITH ONE STEP LEFT ────────────────────────────────────
 * The plumbing is complete — configuration check, collection handles, the
 * mapping through content/shopify/adapter.ts, and the fallback to local data.
 * What is NOT written is the GraphQL query document itself.
 *
 * That is deliberate. The adapter was built against the ADMIN schema, which
 * was introspected and verified field by field. A public website should read
 * the STOREFRONT API instead, and its schema is a different shape — I have no
 * Storefront token here, so I cannot introspect it. Writing the query from
 * memory would be guessing at field names, which CLAUDE.md rule 3 forbids.
 *
 * TO FINISH IT, once a Storefront token exists:
 *   1. introspect the Storefront schema for Collection, Product, Metafield
 *   2. write PRODUCTS_IN_COLLECTION against the verified fields
 *   3. adjust ShopifyProductNode in adapter.ts if the shapes differ from Admin
 *   4. delete the early return in fetchCollection below
 * Everything else — mapping, defaults, placeholders, booking flags — already
 * works and is covered by the existing behaviour.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── HOW MANUAL PRODUCTS WILL REACH THE SITE ──────────────────────────────
 *   Shopify Admin → Products → Add product
 *     · put it in the Travel or Events collection
 *     · fill the metafields listed in content/shopify/metafields.ts
 *     · save
 *   → this module reads the collection
 *   → adapter.ts maps it to a Trip or PlanetEvent
 *   → content/source.ts serves it
 *   → listing → detail → the correct booking flow
 *
 * Missing metafields are never invented: booleans default to false, prices
 * stay undefined, and the page renders "not set" through the placeholder
 * system. A trip cannot acquire a seat map by omission.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { toEvent, toTrip, type ShopifyProductNode } from "./adapter";
import type { PlanetEvent } from "../events";
import type { Trip } from "../trips";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

/**
 * Both variables must be set before the site reads the store. Put them in
 * .env.local:
 *   SHOPIFY_STORE_DOMAIN=planetinfinity.online
 *   SHOPIFY_STOREFRONT_TOKEN=<Storefront API access token>
 */
export function isShopifyConfigured(): boolean {
  return Boolean(STORE_DOMAIN && STOREFRONT_TOKEN);
}

/** Collection handles the site reads from. Neither exists in the store yet. */
export const COLLECTION_HANDLES = { trips: "travel", events: "events" } as const;

/** True once the query document has been written against a verified schema. */
export const QUERY_IMPLEMENTED = false;

/**
 * Returns the products in one collection, mapped later by the caller.
 *
 * Returns an empty array whenever Shopify is not configured, the query is not
 * yet written, or the store is unreachable — an unavailable store must never
 * take the website down with it.
 */
async function fetchCollection(handle: string): Promise<ShopifyProductNode[]> {
  if (!isShopifyConfigured() || !QUERY_IMPLEMENTED) return [];

  // The verified query goes here. Until then this branch is unreachable.
  void handle;
  return [];
}

export async function fetchTrips(): Promise<Trip[]> {
  return (await fetchCollection(COLLECTION_HANDLES.trips)).map(toTrip);
}

export async function fetchEvents(): Promise<PlanetEvent[]> {
  return (await fetchCollection(COLLECTION_HANDLES.events)).map(toEvent);
}
