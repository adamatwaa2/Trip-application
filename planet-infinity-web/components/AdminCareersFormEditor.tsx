"use client";

import { useState, useTransition } from "react";
import { saveCareersForm } from "@/app/actions/admin";
import { BookingFormBuilder } from "@/components/BookingFormBuilder";
import type { BookingFormField } from "@/lib/booking-form";

export function AdminCareersFormEditor({ initial }: { initial: BookingFormField[] }) {
  const [fields, setFields] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form className="pi-admin-form" onSubmit={(event) => {
      event.preventDefault();
      setMessage(null);
      startTransition(async () => {
        const result = await saveCareersForm(fields);
        setMessage(result.ok ? "Careers questions saved." : result.error);
      });
    }}>
      <BookingFormBuilder fields={fields} onChange={setFields} />
      {message ? <p className={message === "Careers questions saved." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
      <button className="pi-admin-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save Careers questions"}</button>
    </form>
  );
}
