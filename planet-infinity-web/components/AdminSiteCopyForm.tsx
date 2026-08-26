"use client";

import { useState, useTransition } from "react";
import { saveSiteCopy } from "@/app/actions/admin";
import { SITE_COPY_FIELDS, type SiteCopy } from "@/content/site-copy";

export function AdminSiteCopyForm({ initial }: { initial: SiteCopy }) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="pi-admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await saveSiteCopy(values);
          setMessage(result.ok ? "Website copy saved." : result.error);
        });
      }}
    >
      <div className="pi-admin-form__grid pi-admin-form__grid--two">
        {SITE_COPY_FIELDS.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.multiline ? (
              <textarea
                value={values[field.key]}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            ) : (
              <input
                value={values[field.key]}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            )}
          </label>
        ))}
      </div>
      {message ? <p className={message === "Website copy saved." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
      <button className="pi-admin-button" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save website copy"}
      </button>
    </form>
  );
}

