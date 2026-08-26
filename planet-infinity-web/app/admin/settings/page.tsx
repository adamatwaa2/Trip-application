import { AdminPolicyForm } from "@/components/AdminPolicyForm";
import { AdminSiteCopyForm } from "@/components/AdminSiteCopyForm";
import { AdminShell } from "@/components/AdminShell";
import { getPolicies } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";
import { isPaymobConfigured } from "@/lib/paymob/config";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata = { title: "Admin settings" };
export default async function SettingsPage() {
  const profile = await requireAdmin();
  const [result, siteCopy] = await Promise.all([getPolicies(), getSiteCopy()]);
  const manualTransferConfigured = Boolean(process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS?.trim());
  const integrations = [
    {
      name: "Manual / InstaPay",
      ready: manualTransferConfigured,
      detail: manualTransferConfigured
        ? "Customer instructions are visible. Admin verification remains required."
        : "Add the public InstaPay address and receiving account name.",
    },
    {
      name: "Paymob",
      ready: isPaymobConfigured(),
      detail: isPaymobConfigured()
        ? "Card checkout credentials are connected."
        : "Code is ready and waiting for the four Paymob credentials.",
    },
    {
      name: "WhatsApp Booking Confirmation",
      ready: isWhatsAppConfigured(),
      detail: isWhatsAppConfigured()
        ? "Booking Confirmation delivery is connected."
        : "Code is ready and waiting for the Meta phone, token, secret, webhook token, and approved template.",
    },
  ];

  return <AdminShell profile={profile} current="/admin/settings"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Settings</p><h1>Website copy, integrations and policies.</h1><p>Edit the main public wording here, check connection readiness, and keep legal policies versioned below.</p></header><section className="pi-admin-section"><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Public website</p><h2>Website copy</h2></div></div><p className="pi-admin-help">These fields control public headings, introductions, buttons, empty states and the reusable labels on trip and event pages. Each trip and event keeps its own title, description and operational details inside its editor.</p><AdminSiteCopyForm initial={siteCopy} /></section><section className="pi-admin-section"><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Connections</p><h2>Payment & messaging readiness</h2></div></div><div className="pi-admin-integration-grid">{integrations.map((integration) => <article key={integration.name} className="pi-admin-integration-card"><div><h3>{integration.name}</h3><span className={`pi-admin-status pi-admin-status--${integration.ready ? "confirmed" : "pending"}`}>{integration.ready ? "ready" : "waiting for keys"}</span></div><p>{integration.detail}</p></article>)}</div><p className="pi-admin-help">Secret values are entered only in the protected server environment, never in this dashboard or in chat.</p></section>{result.error ? <p className="pi-admin-error">{result.error}</p> : result.items.map((policy) => <section className="pi-admin-section" key={policy.id}><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">{policy.slug}</p><h2>{policy.title}</h2></div><span className={`pi-admin-status pi-admin-status--${policy.is_active ? "confirmed" : "void"}`}>{policy.is_active ? "active" : "inactive"}</span></div><AdminPolicyForm policy={policy} /></section>)}</AdminShell>;
}
