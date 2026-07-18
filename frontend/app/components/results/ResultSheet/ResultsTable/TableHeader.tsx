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
              border
              border-[#555]
              bg-[#efefef]
              text-[#444]
              text-[10px]
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
