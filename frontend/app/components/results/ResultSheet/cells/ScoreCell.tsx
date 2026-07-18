import clsx from "clsx";

interface Props {
    value?: number;
    grade: string;
}

export default function ScoreCell({
    value,
    grade,
}: Props) {
    return (
        <td
            className={clsx(
                "border border-[#555] text-center py-[2px]",
                ["E", "F"].includes(grade) &&
                    "text-red-600 font-bold"
            )}
        >
            {value ?? "-"}
        </td>
    );
}