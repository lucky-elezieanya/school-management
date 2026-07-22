import clsx from "clsx";

interface Props {
  value?: number;
  grade: string;
}

export default function ScoreCell({ value, grade }: Props) {
  return (
    <td
      className={clsx(
        "border-[0.5px] border-gray-400 text-center text-[11px] font-bold py-[2px]",
        ["E", "F"].includes(grade) && "text-red-600 font-bold",
      )}
    >
      {value ?? "-"}
    </td>
  );
}
