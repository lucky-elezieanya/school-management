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

        bg-white
        border-[0.5px]
        border-gray-300
        rounded-md
        overflow-hidden
        text-[#220080]
        p-[10px]
      "
    >
      {/* Watermark */}
      <Watermark logo={snapshot.assets.logo} />

      {/* Page Content */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* School Header */}
        <Header image={snapshot?.assets?.header || "/cozzi-header.png"} />

        {/* Student Information */}
        <StudentInformation snapshot={snapshot} />

        {/* Subject Results */}
        <ResultsTable snapshot={snapshot} />

        {/* Chart, Behaviour & Comments */}
        <BottomSection snapshot={snapshot}/>
      </div>
    </div>
  );
}
