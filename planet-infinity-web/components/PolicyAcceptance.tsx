"use client";

import Link from "next/link";
import {
  APPLICATION_ACCEPTANCE_POLICIES,
  BOOKING_ACCEPTANCE_POLICIES,
} from "@/content/policies";

type PolicyAcceptanceProps = {
  checked: boolean;
  id?: string;
  onChange: (checked: boolean) => void;
  scope?: "application" | "booking";
};

export function PolicyAcceptance({
  checked,
  id = "policyAcceptance",
  onChange,
  scope = "booking",
}: PolicyAcceptanceProps) {
  const policies =
    scope === "application" ? APPLICATION_ACCEPTANCE_POLICIES : BOOKING_ACCEPTANCE_POLICIES;

  return (
    <div className="agree-row">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>
        I confirm that I have read, understood, and agree to the required{" "}
        {policies.map((policy, index) => (
          <span key={policy.slug}>
            {index > 0 ? (index === policies.length - 1 ? " and " : ", ") : null}
            <Link href={`/policies/${policy.slug}`}>{policy.shortTitle}</Link>
          </span>
        ))}
        {" "}policies.
        <span className="placeholder-note">
          Your request cannot be accepted unless every required policy is published and your
          acceptance is recorded.
        </span>
      </label>
    </div>
  );
}
