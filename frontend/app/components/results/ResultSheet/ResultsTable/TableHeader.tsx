import { ResultColumn } from "./types";

interface Props {
  columns: ResultColumn[];
}

export default function TableHeader({ columns }: Props) {
  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            className="
            border-[0.5px] border-gray-400
            bg-blue-400
              text-[#fff]
              text-[12px]
              font-bold
              py-[2px]
              px-[4px]
              whitespace-nowrap
            "
          >
            {column.title}
          </th>
        ))}
      </tr>
    </thead>
  );
}
