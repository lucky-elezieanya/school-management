interface StudentMetricProps {
    label: string;
    value?: React.ReactNode;
  }
  
  export default function StudentMetric({
    label,
    value,
  }: StudentMetricProps) {
    return (
      <div className="flex items-center gap-1">
  
        <span className="font-bold">
          {label}
        </span>
  
        <span>
          {value ?? "-"}
        </span>
  
      </div>
    );
  }