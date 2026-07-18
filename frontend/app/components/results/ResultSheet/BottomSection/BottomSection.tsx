import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import BehaviourPanel from "./Behaviour/BehaviourPanel";
import CommentPanel from "./Comments/CommentPanel";
import PerformanceChart from "./PerformanceChart/PerformanceChart";

interface BottomSectionProps {
  snapshot: StudentResultSnapshot;
}

export default function BottomSection({ snapshot }: BottomSectionProps) {
  const { customization, behaviour, comments, chart } = snapshot;

  return (
    <section className="mt-3 space-y-3">
      {customization.showPerformanceChart && chart && (
        <PerformanceChart chart={chart} />
      )}

      <div
        className="
          grid
          grid-cols-[1fr_24px_2fr]
          items-start
        "
      >
        {customization.showBehaviour ? (
          <BehaviourPanel behaviour={behaviour} />
        ) : (
          <div />
        )}

        <div />

        <CommentPanel snapshot={snapshot} />
      </div>
    </section>
  );
}
