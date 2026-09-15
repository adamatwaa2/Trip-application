import { TripApplicationForm } from "@/components/TripApplicationForm";
import { getTripRequestForm } from "@/app/actions/request-form";

type Props = {
  searchParams: Promise<{ product?: string; title?: string; type?: string }>;
};

export default async function ApplyPage({ searchParams }: Props) {
  const query = await searchParams;
  const productId = (query.product ?? "").trim();
  const form = query.type === "trip" && productId
    ? await getTripRequestForm(productId)
    : { fields: [], theme: {}, identity: undefined, title: null };

  return (
    <TripApplicationForm
      productId={productId || undefined}
      title={(form.title ?? query.title ?? "Planet Infinity").slice(0, 160)}
      fields={form.fields}
      formTheme={form.theme}
      identity={form.identity}
    />
  );
}
