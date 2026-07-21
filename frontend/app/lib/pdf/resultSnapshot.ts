import { apiHeaders, BASE_URL } from "../api";

export async function getSnapshot(snapshotId: string) {
  const response = await fetch(
    `${BASE_URL}/results/result-snapshots/${snapshotId}/`,
    {
      cache: "no-store",
      headers: apiHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch snapshot.");
  }

  return response.json();
}
