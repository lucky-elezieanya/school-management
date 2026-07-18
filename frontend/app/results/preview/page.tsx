import ResultSheet from "@/app/components/results/ResultSheet/ResultSheet";
import { snapshot } from "@/app/mocks/resultSnapshot";

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-slate-200 py-8 flex justify-center">
      <ResultSheet snapshot={snapshot} />
    </main>
  );
}
