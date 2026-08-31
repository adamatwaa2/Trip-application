"use client";

import type { TripOptionGroup } from "@/content/trips";

export type SelectionState = Record<string, string>;

type TripSelectionProps = {
  groups: TripOptionGroup[];
  value: SelectionState;
  onChange: (groupId: string, choiceId: string) => void;
};

/**
 * Trip selection — dates, packages, variants, editions, options.
 *
 * Only the groups a trip actually defines are rendered; nothing is assumed to
 * exist. This is entirely separate from seat selection: a trip can have this
 * step with no seat map, and a seat map with no selection step.
 */
export function TripSelection({ groups, value, onChange }: TripSelectionProps) {
  return (
    <div className="pi-selection">
      {groups.map((group) => (
        <fieldset key={group.id} className="pi-selection__group">
          <legend className="pi-selection__legend">
            {group.label}
            {group.required ? null : (
              <span className="pi-selection__optional"> (optional)</span>
            )}
          </legend>
          {group.hint ? (
            <p className="pi-selection__hint">{group.hint}</p>
          ) : null}

          <div className="pi-selection__choices">
            {group.choices.map((choice) => {
              const checked = value[group.id] === choice.id;
              return (
                <label
                  key={choice.id}
                  className={[
                    "pi-choice",
                    checked ? "pi-choice--checked" : null,
                    choice.soldOut ? "pi-choice--soldout" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="radio"
                    name={group.id}
                    value={choice.id}
                    checked={checked}
                    disabled={choice.soldOut}
                    onChange={() => onChange(group.id, choice.id)}
                  />
                  <span className="pi-choice__indicator" aria-hidden="true" />
                  <span className="pi-choice__body">
                    <span className="pi-choice__label">{choice.label}</span>
                    {choice.detail ? (
                      <span className="pi-choice__detail">{choice.detail}</span>
                    ) : null}
                  </span>
                  <span className="pi-choice__meta">
                    {choice.soldOut ? (
                      <span className="pi-choice__soldout">Sold out</span>
                    ) : choice.priceDeltaEgp ? (
                      <span className="pi-choice__delta">
                        +{choice.priceDeltaEgp.toLocaleString("en-US")} EGP
                      </span>
                    ) : choice.priceEgp !== undefined ? (
                      <span className="pi-choice__delta">
                        {choice.priceEgp.toLocaleString("en-US")} EGP
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
