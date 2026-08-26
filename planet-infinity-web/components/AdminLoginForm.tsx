"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);

    if (signInError) {
      setError("The email or password is not valid.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="pi-admin-login__form" onSubmit={onSubmit}>
      <label htmlFor="admin-email">Email</label>
      <input
        id="admin-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <label htmlFor="admin-password">Password</label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? <p className="pi-admin-error" role="alert">{error}</p> : null}
      <button className="pi-admin-button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Link className="pi-admin-login__link" href="/admin/forgot-password">
        Forgot your password?
      </Link>
    </form>
  );
}
