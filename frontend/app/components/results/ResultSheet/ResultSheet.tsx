import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import Header from "./Header/Header";
import ResultsTable from "./ResultsTable/ResultsTable";
import StudentInformation from "./StudentInformation/StudentInformation";
import Watermark from "./Watermark/Watermark";
import BottomSection from "./BottomSection/BottomSection";

interface Props {
  snapshot: StudentResultSnapshot;
}

export default function ResultSheet({ snapshot }: Props) {
  return (
    <div
      className="
        relative
        w-[210mm]
        min-h-[297mm]
        bg-white
        border
        border-[#555]
        overflow-hidden
        text-[#220080]
        p-[8mm]
      "
    >
      {/* Watermark */}
      <Watermark logo={snapshot.assets.logo} />

      {/* Page Content */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* School Header */}
        <Header image={snapshot.assets.header} />

        {/* Student Information */}
        <StudentInformation snapshot={snapshot} />

        {/* Subject Results */}
        <ResultsTable snapshot={snapshot} />

        {/* Chart, Behaviour & Comments */}
        <BottomSection snapshot={snapshot} />
      </div>
    </div>
  );
}
