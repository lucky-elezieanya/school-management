import clsx from "clsx";

interface StudentMetricProps {
  label: string;
  value?: React.ReactNode;
}

export default function StudentMetric({ label, value }: StudentMetricProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-bold text-gray-700 text-[12px]">{label}</span>

      <span
        className={clsx(
          "text-[12px] font-bold",
          label === "Name:" && "uppercase",
        )}
      >
        {value ?? "-"}
      </span>
    </div>
  );
}
