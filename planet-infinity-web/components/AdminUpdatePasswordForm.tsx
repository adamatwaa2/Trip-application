"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminUpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError("That reset link has expired. Request a new one and try again.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="pi-admin-login__form" onSubmit={onSubmit}>
      <p className="pi-admin-login__intro">Choose a new password for the admin panel.</p>
      <label htmlFor="admin-new-password">New password</label>
      <input
        id="admin-new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={12}
        required
      />
      <label htmlFor="admin-confirm-password">Confirm new password</label>
      <input
        id="admin-confirm-password"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        minLength={12}
        required
      />
      {error ? <p className="pi-admin-error" role="alert">{error}</p> : null}
      <button className="pi-admin-button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
