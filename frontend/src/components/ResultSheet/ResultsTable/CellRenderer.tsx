import { ResultColumn, SubjectResult } from "./types";

import DefaultCell from "../cells/DefaultCell";
import GradeCell from "../cells/GradeCell";
import PositionCell from "../cells/PositionsCell";
import RemarkCell from "../cells/RemarksCell";
import ScoreCell from "../cells/ScoreCell";
import SubjectCell from "../cells/SubjectCell";

interface CellRendererProps {
  column: ResultColumn;
  result: SubjectResult;
  index: number;
}

export default function CellRenderer({
  column,
  result,
  index,
}: CellRendererProps) {
  switch (column.id) {
    case "sn":
      return <DefaultCell value={index + 1} />;

    case "subject":
      return <SubjectCell value={result.subjectName} />;

    case "ca1":
      return <DefaultCell value={result.firstTest} />;

    case "ca2":
      return <DefaultCell value={result.secondTest} />;

    case "exam":
      return <DefaultCell value={result.examScore} />;

    case "total":
      return <ScoreCell value={result.totalScore} grade={result.grade} />;

    case "t1":
      return <DefaultCell value={result.firstTermTotal} />;

    case "t2":
      return <DefaultCell value={result.secondTermTotal} />;

    case "t3":
      return <DefaultCell value={result.thirdTermTotal} />;

    case "cum":
      return <DefaultCell value={result.cumulativeAverage} />;

    case "average":
      return <DefaultCell value={result.subjectAverage} />;

    case "score":
      return <DefaultCell value={result.subjectScore} />;

    case "grade":
      return <GradeCell value={result.grade} />;

    case "position":
      return <PositionCell value={result.subjectPosition} />;

    case "remark":
      return <RemarkCell value={result.remark} />;

    default:
      return <DefaultCell value="-" />;
  }
}
