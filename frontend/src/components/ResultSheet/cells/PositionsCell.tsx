import { renderPosition } from "@/app/components/sections/Broadsheet/BroadsheetTable";

interface Props {
  value?: string;
}

export default function PositionCell({ value }: Props) {
  return (
    <td className="border-[0.5px] border-gray-400 text-center font-bold text-[11px] py-[2px]">
      {renderPosition(value) ?? "-"}
    </td>
  );
}
