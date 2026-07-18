import { BehaviourSnapshot } from "@/app/types/result-snapshot";
import BehaviourTable from "./BehaviourTable";

interface BehaviourPanelProps {
  behaviour: BehaviourSnapshot;
}

export default function BehaviourPanel({ behaviour }: BehaviourPanelProps) {
  if (!behaviour.items.length) {
    return null;
  }

  return (
    <div className="w-full">
      <BehaviourTable behaviour={behaviour} />
    </div>
  );
}
