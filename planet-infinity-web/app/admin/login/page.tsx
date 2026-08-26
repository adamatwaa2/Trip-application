import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <main className="pi-admin-login">
      <div className="pi-admin-login__card">
        <p className="pi-admin-kicker">Planet Infinity · Admin</p>
        <h1>Manage every booking.</h1>
        {!configured ? (
          <p className="pi-admin-error">
            Supabase is not configured locally. Copy .env.example to .env.local and add the new project&apos;s URL and publishable key.
          </p>
        ) : params.reason === "configuration" ? (
          <p className="pi-admin-error">The admin panel is not configured yet.</p>
        ) : (
          <AdminLoginForm />
        )}
      </div>
    </main>
  );
}
