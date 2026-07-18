interface Props {
  value: string;
}

export default function RemarkCell({ value }: Props) {
  return (
    <td className="border border-[#555] text-center py-[2px] whitespace-nowrap">
      {value}
    </td>
  );
}
