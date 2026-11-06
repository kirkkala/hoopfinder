type CountedCourt = {
  editOf: string | null;
  status: "unconfirmed" | "pending" | "published";
};

export type AdminOverview = {
  feedback: number | null;
  photos: number | null;
  photoCourts: number | null;
  courts: number | null;
  edits: { unconfirmed: number; pending: number; published: number } | null;
};

/** Counts for the admin home. A null list means that source could not be read. */
export function adminOverview(input: {
  feedback: readonly unknown[] | null;
  photos: readonly { photoCount: number }[] | null;
  courts: readonly CountedCourt[] | null;
}): AdminOverview {
  const submissions = input.courts?.filter((court) => !court.editOf);
  const edits = input.courts?.filter((court) => court.editOf);
  return {
    feedback: input.feedback?.length ?? null,
    photos: input.photos?.reduce((sum, court) => sum + court.photoCount, 0) ?? null,
    photoCourts: input.photos?.length ?? null,
    courts: submissions?.length ?? null,
    edits: edits
      ? {
          unconfirmed: edits.filter((court) => court.status === "unconfirmed").length,
          pending: edits.filter((court) => court.status === "pending").length,
          published: edits.filter((court) => court.status === "published").length,
        }
      : null,
  };
}
