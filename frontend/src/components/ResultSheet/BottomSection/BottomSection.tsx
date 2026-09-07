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
    <section className="mt-0 space-y-1 mb-0">
      {customization.showPerformanceChart && (
        <PerformanceChart svg={snapshot.charts.performance} />
      )}

      <div
        className="
          border-[0.5px] border-gray-400 
          grid grid-cols-[1fr_24px_2fr] mb-0
        "
      >
        <div className="behaviour flex justify-end p-0 max-h-[180px] overflow-hidden">
          {customization.showBehaviour ? (
            <BehaviourPanel behaviour={behaviour} />
          ) : (
            <div />
          )}
        </div>
        <div />
        <div className="comments p-0 max-h-[150px] overflow-hidden">
          <CommentPanel snapshot={snapshot} />
        </div>
      </div>
    </section>
  );
}
