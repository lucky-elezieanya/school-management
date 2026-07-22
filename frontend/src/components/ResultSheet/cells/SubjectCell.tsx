interface Props {
  value: string;
}

export default function SubjectCell({ value }: Props) {
  return (
    <td
      className="border-[0.5px]
    border-gray-400
     text-left font-semibold text-[9px] px-1 py-[2px] whitespace-nowrap"
    >
      {value}
    </td>
  );
}
