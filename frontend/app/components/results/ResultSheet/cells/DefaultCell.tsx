interface Props {
    value?: React.ReactNode;
}

export default function DefaultCell({
    value,
}: Props) {
    return (
        <td className="border border-[#555] text-center py-[2px]">
            {value ?? "-"}
        </td>
    );
}