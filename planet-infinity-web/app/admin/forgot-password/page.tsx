import { AdminPasswordResetRequestForm } from "@/components/AdminPasswordResetRequestForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Reset admin password" };

export default async function AdminForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="pi-admin-login">
      <div className="pi-admin-login__card">
        <p className="pi-admin-kicker">Planet Infinity · Admin</p>
        <h1>Reset your password.</h1>
        {params.reason === "expired" ? (
          <p className="pi-admin-error">
            That reset link has already been used or has expired. Request one new link, then open it only on this computer.
          </p>
        ) : null}
        {isSupabaseConfigured() ? (
          <AdminPasswordResetRequestForm />
        ) : (
          <p className="pi-admin-error">The request inbox is not configured yet.</p>
        )}
      </div>
    </main>
  );
}
