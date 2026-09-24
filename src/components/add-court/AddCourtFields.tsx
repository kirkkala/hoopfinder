"use client";

import { ChevronDown } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import {
  ADMIN_CODES,
  COURT_STATUS_CODES,
  FIELD_TYPE_CODES,
  OWNER_CODES,
  COMMON_SURFACE_CODES,
  SURFACE_CODES,
  HOOP_HEIGHT_CODES,
  WATER_POINT_CODES,
  type Court,
} from "@/lib/courts";

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-xl border border-white/25 bg-asphalt py-0 pr-10 pl-3 text-base text-white outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

export type Tri = "" | "yes" | "no";

export type AddCourtDetails = {
  courtStatus: "" | (typeof COURT_STATUS_CODES)[number];
  website: string;
  comment: string;
  owner: string;
  admin: string;
  lighting: Tri;
  lightingInfo: string;
  freeUse: Tri;
  schoolUse: Tri;
  fieldType: string;
  surfaceMaterial: "" | (typeof SURFACE_CODES)[number];
  lengthM: string;
  widthM: string;
  areaM2: string;
  toilet: Tri;
  heightAdjustable: Tri;
  hoopHeight: "" | (typeof HOOP_HEIGHT_CODES)[number];
  waterPoint: string;
  matchClock: Tri;
  scoreboard: Tri;
};

export const EMPTY_ADD_COURT_DETAILS: AddCourtDetails = {
  courtStatus: "",
  website: "",
  comment: "",
  owner: "",
  admin: "",
  lighting: "",
  lightingInfo: "",
  freeUse: "",
  schoolUse: "",
  fieldType: "",
  surfaceMaterial: "",
  lengthM: "",
  widthM: "",
  areaM2: "",
  toilet: "",
  heightAdjustable: "",
  hoopHeight: "",
  waterPoint: "",
  matchClock: "",
  scoreboard: "",
};

function triFromBool(value: boolean | null | undefined): Tri {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function knownCode<T extends string>(codes: readonly T[], value: string | null | undefined): T | "" {
  return codes.find((code) => code === value) ?? "";
}

export function addCourtDetailsFromCourt(court: Court): AddCourtDetails {
  const { amenities } = court;
  return {
    courtStatus:
      knownCode(COURT_STATUS_CODES, court.status) ||
      knownCode(COURT_STATUS_CODES, court.reportedStatus),
    website: court.website ?? "",
    comment: court.comment ?? "",
    owner: knownCode(OWNER_CODES, court.owner),
    admin: knownCode(ADMIN_CODES, court.admin),
    lighting: triFromBool(amenities.lighting),
    lightingInfo: amenities.lightingInfo ?? "",
    freeUse: triFromBool(amenities.freeUse),
    schoolUse: triFromBool(amenities.schoolUse),
    fieldType: knownCode(FIELD_TYPE_CODES, amenities.fieldType),
    surfaceMaterial: knownCode(SURFACE_CODES, amenities.surfaceMaterial[0]),
    lengthM: amenities.lengthM?.toString() ?? "",
    widthM: amenities.widthM?.toString() ?? "",
    areaM2: amenities.areaM2?.toString() ?? "",
    toilet: triFromBool(amenities.toilet),
    heightAdjustable: triFromBool(amenities.heightAdjustable),
    hoopHeight: knownCode(HOOP_HEIGHT_CODES, amenities.hoopHeight),
    waterPoint: knownCode(WATER_POINT_CODES, amenities.waterPoint),
    matchClock: triFromBool(amenities.matchClock),
    scoreboard: triFromBool(amenities.scoreboard),
  };
}

export function addCourtDetailsDirty(details: AddCourtDetails): boolean {
  return Object.values(details).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== "",
  );
}

export function addCourtDetailsPayload(
  details: AddCourtDetails,
): Record<string, unknown> | "invalid" {
  const lengthM = parseMeasure(details.lengthM, 200);
  const widthM = parseMeasure(details.widthM, 200);
  const areaM2 = parseMeasure(details.areaM2, 20000);
  if (lengthM === "invalid" || widthM === "invalid" || areaM2 === "invalid") {
    return "invalid";
  }
  return {
    courtStatus: details.courtStatus || null,
    website: details.website.trim() || null,
    comment: details.comment.trim() || null,
    owner: details.owner || null,
    admin: details.admin || null,
    lighting: details.lighting || null,
    lightingInfo: details.lightingInfo.trim() || null,
    freeUse: details.freeUse || null,
    schoolUse: details.schoolUse || null,
    fieldType: details.fieldType || null,
    surfaceMaterial: details.surfaceMaterial ? [details.surfaceMaterial] : [],
    lengthM,
    widthM,
    areaM2,
    toilet: details.toilet || null,
    heightAdjustable: details.heightAdjustable || null,
    hoopHeight: details.hoopHeight || null,
    waterPoint: details.waterPoint || null,
    matchClock: details.matchClock || null,
    scoreboard: details.scoreboard || null,
  };
}

function parseMeasure(value: string, max: number): number | null | "invalid" {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number <= 0 || number > max) return "invalid";
  return number;
}

export function AddCourtFields({
  details,
  onChange,
}: {
  details: AddCourtDetails;
  onChange: (next: AddCourtDetails) => void;
}) {
  const copy = useCopy();
  function patch(partial: Partial<AddCourtDetails>) {
    onChange({ ...details, ...partial });
  }

  const statusOptions = [
    ["active", copy.statusOpen],
    ["out-of-service-temporarily", copy.statusTemporarilyClosed],
    ["out-of-service-permanently", copy.statusPermanentlyClosed],
  ] as const;

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="font-display text-lg tracking-wide text-gold">{copy.courtFacts}</p>
      <p className="mt-1 text-xs text-ink-muted">{copy.addCourtOptional}</p>

      <ChoiceSelect
        label={copy.status}
        value={details.courtStatus}
        emptyLabel={copy.addCourtUnknown}
        options={statusOptions.map(([value, label]) => ({ value, label }))}
        onChange={(courtStatus) =>
          patch({ courtStatus: courtStatus as AddCourtDetails["courtStatus"] })
        }
      />
      <ChoiceSelect
        label={copy.fieldType}
        value={details.fieldType}
        emptyLabel={copy.addCourtUnknown}
        options={FIELD_TYPE_CODES.map((code) => ({
          value: code,
          label: copy.fieldTypes[code],
        }))}
        onChange={(fieldType) => patch({ fieldType })}
      />
      <ChoiceSelect
        label={copy.hoopHeight}
        value={details.hoopHeight}
        emptyLabel={copy.addCourtUnknown}
        options={HOOP_HEIGHT_CODES.map((code) => ({
          value: code,
          label: copy.hoopHeights[code],
        }))}
        onChange={(hoopHeight) =>
          patch({ hoopHeight: hoopHeight as AddCourtDetails["hoopHeight"] })
        }
      />

      <p className="mt-3 text-xs text-ink-muted">{copy.addCourtYesNoHint}</p>
      <YesNoField
        label={copy.adjustableRim}
        value={details.heightAdjustable}
        onChange={(heightAdjustable) => patch({ heightAdjustable })}
      />
      <YesNoField
        label={copy.freeUse}
        value={details.freeUse}
        onChange={(freeUse) => patch({ freeUse })}
      />
      <YesNoField
        label={copy.schoolUse}
        value={details.schoolUse}
        onChange={(schoolUse) => patch({ schoolUse })}
      />
      <YesNoField
        label={copy.toilet}
        value={details.toilet}
        onChange={(toilet) => patch({ toilet })}
      />
      <YesNoField
        label={copy.matchClock}
        value={details.matchClock}
        onChange={(matchClock) => patch({ matchClock })}
      />
      <YesNoField
        label={copy.scoreboard}
        value={details.scoreboard}
        onChange={(scoreboard) => patch({ scoreboard })}
      />
      <YesNoField
        label={copy.lights}
        value={details.lighting}
        onChange={(lighting) => patch({ lighting })}
      />
      <TextField
        label={copy.lightingNotes}
        value={details.lightingInfo}
        onChange={(lightingInfo) => patch({ lightingInfo })}
      />

      <ChoiceSelect
        label={copy.surface}
        value={details.surfaceMaterial}
        emptyLabel={copy.addCourtUnknown}
        options={COMMON_SURFACE_CODES.map((code) => ({
          value: code,
          label: copy.surfaces[code],
        }))}
        onChange={(surfaceMaterial) =>
          patch({ surfaceMaterial: surfaceMaterial as AddCourtDetails["surfaceMaterial"] })
        }
      />

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <TextField
          label={copy.lengthM}
          value={details.lengthM}
          inputMode="decimal"
          onChange={(lengthM) => patch({ lengthM })}
        />
        <TextField
          label={copy.widthM}
          value={details.widthM}
          inputMode="decimal"
          onChange={(widthM) => patch({ widthM })}
        />
        <TextField
          label={`${copy.area} (m²)`}
          value={details.areaM2}
          inputMode="decimal"
          onChange={(areaM2) => patch({ areaM2 })}
        />
      </div>

      <ChoiceSelect
        label={copy.waterPoint}
        value={details.waterPoint}
        emptyLabel={copy.addCourtUnknown}
        options={WATER_POINT_CODES.map((code) => ({
          value: code,
          label: copy.waterPoints[code],
        }))}
        onChange={(waterPoint) => patch({ waterPoint })}
      />
      <ChoiceSelect
        label={copy.owner}
        value={details.owner}
        emptyLabel={copy.addCourtUnknown}
        options={OWNER_CODES.map((code) => ({
          value: code,
          label: copy.owners[code],
        }))}
        onChange={(owner) => patch({ owner })}
      />
      <ChoiceSelect
        label={copy.administrator}
        value={details.admin}
        emptyLabel={copy.addCourtUnknown}
        options={ADMIN_CODES.map((code) => ({
          value: code,
          label: copy.admins[code],
        }))}
        onChange={(admin) => patch({ admin })}
      />
      <TextField
        label={copy.website}
        value={details.website}
        onChange={(website) => patch({ website })}
      />
      <TextField
        label={copy.notesFromListing}
        value={details.comment}
        multiline
        onChange={(comment) => patch({ comment })}
      />
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Tri;
  onChange: (value: Tri) => void;
}) {
  const copy = useCopy();
  return (
    <div className="mt-2.5 flex items-center justify-between gap-3">
      <span className="text-sm text-ink/85">{label}</span>
      <span className="flex shrink-0 rounded-full border border-white/15 p-0.5">
        {(
          [
            ["yes", copy.yes],
            ["no", copy.no],
          ] as const
        ).map(([option, text]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            aria-label={`${label}: ${text}`}
            onClick={() => onChange(value === option ? "" : option)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
              value === option ? "bg-gold text-asphalt" : "text-ink/70 hover:text-white"
            }`}
          >
            {text}
          </button>
        ))}
      </span>
    </div>
  );
}

function ChoiceSelect({
  label,
  value,
  emptyLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  emptyLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-2.5 block">
      <span className="mb-1 block text-sm text-ink/85">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">{emptyLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
        />
      </span>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric";
  multiline?: boolean;
}) {
  const className =
    "w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";
  return (
    <label className="mt-2.5 block">
      <span className="mb-1 block text-sm text-ink/85">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          maxLength={2000}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} py-2`}
        />
      ) : (
        <input
          value={value}
          inputMode={inputMode}
          maxLength={inputMode ? 8 : 300}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} h-11`}
        />
      )}
    </label>
  );
}
