"use client";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

export type LocalizedString = {
  fr: string;
  en: string;
};

export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required = false,
}: {
  label: string;
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-3 md:col-span-2">
      <legend className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1.5 rounded-xl border border-border bg-secondary/40 p-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-glow">
            <span className="size-1.5 rounded-full bg-glow" />
            Français
          </span>
          {multiline ? (
            <textarea
              className={fieldClass}
              value={value.fr}
              required={required}
              rows={rows}
              onChange={(event) =>
                onChange({ ...value, fr: event.target.value })
              }
            />
          ) : (
            <input
              className={fieldClass}
              value={value.fr}
              required={required}
              onChange={(event) =>
                onChange({ ...value, fr: event.target.value })
              }
            />
          )}
        </label>
        <label className="block space-y-1.5 rounded-xl border border-border bg-secondary/40 p-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            English
          </span>
          {multiline ? (
            <textarea
              className={fieldClass}
              value={value.en}
              required={required}
              rows={rows}
              onChange={(event) =>
                onChange({ ...value, en: event.target.value })
              }
            />
          ) : (
            <input
              className={fieldClass}
              value={value.en}
              required={required}
              onChange={(event) =>
                onChange({ ...value, en: event.target.value })
              }
            />
          )}
        </label>
      </div>
    </fieldset>
  );
}
