import { BehaviourSnapshot } from "@/app/types/result-snapshot";

interface BehaviourTableProps {
  behaviour: BehaviourSnapshot;
}

export default function BehaviourTable({ behaviour }: BehaviourTableProps) {
  return (
    <table
      className="
        w-full
        border
        border-[#555]
        border-collapse
        text-[10px]
      "
    >
      <thead>
        <tr>
          <th
            className="
              border
              border-[#555]
              bg-[#efefef]
              py-[2px]
              px-1
              font-bold
            "
          >
            S/N
          </th>

          <th
            className="
              border
              border-[#555]
              bg-[#efefef]
              py-[2px]
              px-1
              font-bold
            "
          >
            Item
          </th>

          <th
            className="
              border
              border-[#555]
              bg-[#efefef]
              py-[2px]
              px-1
              font-bold
            "
          >
            Grade
          </th>
        </tr>
      </thead>

      <tbody>
        {behaviour.items.map((item:any, index:number) => (
          <tr key={item.item}>
            <td
              className="
                border
                border-[#555]
                text-center
                py-[2px]
              "
            >
              {index + 1}
            </td>

            <td
              className="
                border
                border-[#555]
                px-2
                py-[2px]
              "
            >
              {item.item}
            </td>

            <td
              className="
                border
                border-[#555]
                text-center
                py-[2px]
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
