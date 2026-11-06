import type { Copy } from "@/lib/copy";
import {
  formatAdmin,
  formatFieldType,
  formatOwner,
  formatStatus,
  formatSurface,
  formatWaterPoint,
} from "@/lib/courts";
import type { CourtEditChanges } from "@/lib/submitted-courts";

export type EditChangeLine = { key: keyof CourtEditChanges; label: string; value: string };

/** Labels an admin can read without opening the court. */
export function editChangeLines(changes: CourtEditChanges, copy: Copy): EditChangeLine[] {
  const lines: EditChangeLine[] = [];
  const cleared = copy.adminEditRemoved;
  const text = (value: string | null | undefined) => value || cleared;
  const tri = (value: "yes" | "no" | null | undefined) =>
    value === "yes" ? copy.yes : value === "no" ? copy.no : cleared;
  const measure = (value: number | null | undefined) =>
    value === null || value === undefined ? cleared : String(value);

  const push = (key: keyof CourtEditChanges, label: string, value: string) => {
    lines.push({ key, label, value });
  };

  if (changes.name) push("name", copy.addCourtName, changes.name);
  if ("address" in changes) push("address", copy.addCourtAddress, text(changes.address));
  if (changes.status) push("status", copy.status, formatStatus(changes.status, copy));
  if ("hoopHeight" in changes) {
    push(
      "hoopHeight",
      copy.hoopHeight,
      changes.hoopHeight ? copy.hoopHeights[changes.hoopHeight] : cleared,
    );
  }
  if ("lighting" in changes) push("lighting", copy.lights, tri(changes.lighting));
  if ("lightingInfo" in changes)
    push("lightingInfo", copy.lightingNotes, text(changes.lightingInfo));
  if ("freeUse" in changes) push("freeUse", copy.freeUse, tri(changes.freeUse));
  if ("schoolUse" in changes) push("schoolUse", copy.schoolUse, tri(changes.schoolUse));
  if ("fieldType" in changes) {
    push(
      "fieldType",
      copy.fieldType,
      changes.fieldType ? formatFieldType(changes.fieldType, copy) : cleared,
    );
  }
  if ("surfaceMaterial" in changes) {
    push(
      "surfaceMaterial",
      copy.surface,
      changes.surfaceMaterial?.length
        ? changes.surfaceMaterial.map((item) => formatSurface(item, copy)).join(", ")
        : cleared,
    );
  }
  if ("lengthM" in changes) push("lengthM", copy.lengthM, measure(changes.lengthM));
  if ("widthM" in changes) push("widthM", copy.widthM, measure(changes.widthM));
  if ("areaM2" in changes) push("areaM2", copy.area, measure(changes.areaM2));
  if ("toilet" in changes) push("toilet", copy.toilet, tri(changes.toilet));
  if ("heightAdjustable" in changes) {
    push("heightAdjustable", copy.adjustableRim, tri(changes.heightAdjustable));
  }
  if ("waterPoint" in changes) {
    push(
      "waterPoint",
      copy.waterPoint,
      changes.waterPoint ? formatWaterPoint(changes.waterPoint, copy) : cleared,
    );
  }
  if ("matchClock" in changes) push("matchClock", copy.matchClock, tri(changes.matchClock));
  if ("scoreboard" in changes) push("scoreboard", copy.scoreboard, tri(changes.scoreboard));
  if ("website" in changes) push("website", copy.website, text(changes.website));
  if ("comment" in changes) push("comment", copy.notesFromListing, text(changes.comment));
  if ("owner" in changes) {
    push("owner", copy.owner, changes.owner ? formatOwner(changes.owner, copy) : cleared);
  }
  if ("admin" in changes) {
    push("admin", copy.administrator, changes.admin ? formatAdmin(changes.admin, copy) : cleared);
  }
  return lines;
}
