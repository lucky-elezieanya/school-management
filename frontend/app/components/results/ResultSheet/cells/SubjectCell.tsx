interface Props {
  value: string;
}

export default function SubjectCell({ value }: Props) {
  return (
    <td className="border border-[#555] text-left font-semibold text-[9px] px-1 py-[2px] whitespace-nowrap">
      {value}
    </td>
  );
}
