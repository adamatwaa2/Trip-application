import { AdminUpdatePasswordForm } from "@/components/AdminUpdatePasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Choose a new admin password" };

export default function AdminUpdatePasswordPage() {
  return (
    <main className="pi-admin-login">
      <div className="pi-admin-login__card">
        <p className="pi-admin-kicker">Planet Infinity · Admin</p>
        <h1>Choose a new password.</h1>
        {isSupabaseConfigured() ? (
          <AdminUpdatePasswordForm />
        ) : (
          <p className="pi-admin-error">The request inbox is not configured yet.</p>
        )}
      </div>
    </main>
  );
}
