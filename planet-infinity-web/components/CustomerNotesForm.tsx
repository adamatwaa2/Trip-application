"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerNotes } from "@/app/actions/admin";

export function CustomerNotesForm({ customerId, initialNotes }: { customerId: string; initialNotes: string | null }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateCustomerNotes({ customerId, notes });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Customer notes saved.");
      router.refresh();
    });
  }

  return (
    <form className="pi-admin-status-form" onSubmit={submit}>
      <label htmlFor="customer-notes">Internal CRM notes</label>
      <textarea
        id="customer-notes"
        value={notes}
        maxLength={4000}
        disabled={pending}
        placeholder="Add preferences, follow-up context, or anything the team should remember."
        onChange={(event) => setNotes(event.target.value)}
      />
      {message ? <p className={message === "Customer notes saved." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
      <button className="pi-admin-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save notes"}</button>
    </form>
  );
}
