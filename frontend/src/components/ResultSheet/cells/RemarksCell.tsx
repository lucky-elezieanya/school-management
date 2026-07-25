interface Props {
  value: string;
}

export default function RemarkCell({ value }: Props) {
  return (
    <td className="border-[0.5px] border-gray-400 text-center py-[2px] text-[11px] italic font-bold whitespace-nowrap">
      {value}
    </td>
  );
}
