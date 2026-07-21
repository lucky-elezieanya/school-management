import ResultSheet from "@/app/components/results/ResultSheet";
import { getSnapshot } from "@/app/lib/pdf/resultSnapshot";


export default async function Page({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;

  const snapshot = await getSnapshot(snapshotId);

  return (
    <ResultSheet
      snapshot={snapshot}
    
    />
  );
}