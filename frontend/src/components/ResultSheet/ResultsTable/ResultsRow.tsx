
import CellRenderer from "./CellRenderer";
import { ResultColumn, SubjectResult } from "./types";

interface Props {
  result: SubjectResult;

  index: number;

  columns: ResultColumn[];
}

export default function ResultsRow({
  result,

  index,

  columns,
}: Props) {
  return (
    <tr>
      {columns.map((column) => (
        <CellRenderer
          key={column.id}
          column={column}
          result={result}
          index={index}
        />
      ))}
    </tr>
  );
}
