"use client";

import { useState } from "react";
import { inviteAdmin } from "@/app/actions/admin";

export function AdminTeamInviteForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setSuccess(false);
    const result = await inviteAdmin({
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
    });
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setSuccess(true);
    setMessage("Invitation sent. They can set their password from the email, then open /admin.");
  }

  return (
    <form className="pi-admin-form" action={submit}>
      <div className="pi-admin-form__grid pi-admin-form__grid--two">
        <label>Full name<input name="fullName" required minLength={2} maxLength={120} /></label>
        <label>Email address<input name="email" type="email" required maxLength={254} /></label>
      </div>
      {message ? <p className={success ? "pi-admin-success" : "pi-admin-error"} role="status">{message}</p> : null}
      <button className="pi-admin-button" type="submit" disabled={pending}>{pending ? "Sending invitation…" : "Invite administrator"}</button>
    </form>
  );
}
