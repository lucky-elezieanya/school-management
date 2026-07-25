import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import BehaviourPanel from "./Behaviour/BehaviourPanel";
import CommentPanel from "./Comments/CommentPanel";
import PerformanceChart from "./PerformanceChart/PerformanceChart_svg";

interface BottomSectionProps {
  snapshot: StudentResultSnapshot;
}

export default function BottomSection({ snapshot }: BottomSectionProps) {
  const { customization, behaviour } = snapshot;

  return (
    <section className="mt-1 space-y-3">
      {customization.showPerformanceChart && (
        <PerformanceChart svg={snapshot.charts.performance} />
        // <PerformanceChart subjects={snapshot.subjects} />
      )}

      <div
        className="
          grid
          grid-cols-[1fr_24px_2fr]
          items-start
          border-[0.5px] border-gray-400 
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
