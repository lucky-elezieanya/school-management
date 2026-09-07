import clsx from "clsx";

interface StudentMetricProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
}

export default function StudentMetric({ label, value, className }: StudentMetricProps) {
  return (
    <div className={clsx("flex items-center gap-1")}>
      <span className="font-bold text-gray-700 text-[12px]">{label}</span>

      <span
        className={clsx(
          "text-[12px] font-bold",
         className
        )}
      >
        {value ?? "-"}
      </span>
    </div>
  );
}
