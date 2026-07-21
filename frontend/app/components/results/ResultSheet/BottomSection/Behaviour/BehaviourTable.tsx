import { BehaviourSnapshot } from "@/app/types/result-snapshot";

interface BehaviourTableProps {
  behaviour: BehaviourSnapshot;
}

export default function BehaviourTable({ behaviour }: BehaviourTableProps) {
  return (
    <table
      className="
        w-full
        border-[0.5px] border-gray-400
        border-collapse
        text-[10px]
      "
    >
      <thead>
        <tr>
          <th
            className="
             text-[11px]
              border-[0.5px] border-gray-400
              bg-blue-400 font-bold
              text-[#fff]
              font-bold
              py-[2px]
              px-1
            "
          >
            S/N
          </th>

          <th
            className="
            text-[11px]
            border-[0.5px] border-gray-400
              
              bg-blue-400 font-bold
              text-[#fff]
              font-bold
              py-[2px]
              px-1
              font-bold
            "
          >
            Item
          </th>

          <th
            className="
            border-[0.5px] border-gray-400
              bg-blue-400 font-bold
              text-[#fff]
              font-bold
              py-[2px]
              px-1
              font-bold text-[11px]
            "
          >
            Grade
          </th>
        </tr>
      </thead>

      <tbody>
        {behaviour.items.map((item: any, index: number) => (
          <tr key={item.item}>
            <td
              className="
              border-[0.5px] border-gray-400
                text-center
                text-[11px]
                py-[2px]
              "
            >
              {index + 1}
            </td>

            <td
              className="
              border-[0.5px] border-gray-400
                px-2
                py-[2px] text-[11px]
              "
            >
              {item.item}
            </td>

            <td
              className="
              border-[0.5px] border-gray-400
                text-center
                py-[2px] text-[11px]
                font-semibold
              "
            >
              {item.grade}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
