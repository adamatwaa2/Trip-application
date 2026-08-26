"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminPasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/confirm?next=/admin/update-password` }
    );

    setPending(false);
    if (resetError) {
      const message = resetError.message.toLowerCase();
      setError(
        message.includes("rate") || message.includes("too many") || resetError.status === 429
          ? "A reset email was just requested. Wait a few minutes, then use only the newest email link on this computer."
          : "We could not send the reset email. Please try again in a moment."
      );
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="pi-admin-login__message">
        <p className="pi-admin-success">
          Check your email for the secure link to choose a new password.
        </p>
        <Link className="pi-admin-login__link" href="/admin/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="pi-admin-login__form" onSubmit={onSubmit}>
      <p className="pi-admin-login__intro">
        Enter your admin email and we&apos;ll send a secure password-reset link.
      </p>
      <label htmlFor="admin-reset-email">Email</label>
      <input
        id="admin-reset-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {error ? <p className="pi-admin-error" role="alert">{error}</p> : null}
      <button className="pi-admin-button" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link className="pi-admin-login__link" href="/admin/login">
        Back to sign in
      </Link>
    </form>
  );
}
