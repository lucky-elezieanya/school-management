import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import { getColumns } from "./columns";
import ResultsRow from "./ResultsRow";
import TableHeader from "./TableHeader";

interface ResultsTableProps {
  snapshot: StudentResultSnapshot;
}

export default function ResultsTable({
  snapshot,
}: ResultsTableProps) {
  const columns = getColumns(snapshot);

  return (
    <table
      className="
        w-full
        border
        border-[#555]
        border-collapse
        text-[9px]
        text-[#0b0c63]
        mt-2
      "
    >
      <TableHeader columns={columns} />

      <tbody>
        {snapshot.subjects.map((result, index) => (
          <ResultsRow
            key={result.subjectId}
            result={result}
            index={index}
            columns={columns}
          />
        ))}
      </tbody>
    </table>
  );
}