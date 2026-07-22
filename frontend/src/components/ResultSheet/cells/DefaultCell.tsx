interface Props {
    value?: React.ReactNode;
}

export default function DefaultCell({
    value,
}: Props) {
    return (
      <td
        className="border-[0.5px]
        border-gray-400
         text-center text-[11px] font-bold py-[2px]"
      >
        {value ?? "-"}
      </td>
    );
}