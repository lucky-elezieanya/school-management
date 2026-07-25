import { StudentResultSnapshot } from "@/app/types/result-snapshot";

export async function processSnapshots(
  snapshots: StudentResultSnapshot[],
  worker: (snapshot: StudentResultSnapshot) => Promise<void>,
  concurrency = 4,
  onProgress?: (completed: number, total: number) => void,
) {
  let index = 0;
  let completed = 0;

  async function runWorker() {
    while (true) {
      const current = index++;

      if (current >= snapshots.length) {
        return;
      }

      try {
        await worker(snapshots[current]);
      } catch (err) {
        console.error(
          `Failed generating PDF for student ${snapshots[current].student.id}`,
          err,
        );
      } finally {
        completed++;

        onProgress?.(completed, snapshots.length);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, snapshots.length) }, () =>
      runWorker(),
    ),
  );
}
