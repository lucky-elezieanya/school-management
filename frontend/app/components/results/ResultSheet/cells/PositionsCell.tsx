interface Props {
  value?: string;
}

export default function PositionCell({ value }: Props) {
  return (
    <td className="border border-[#555] text-center py-[2px]">
      {value ?? "-"}
    </td>
  );
}
