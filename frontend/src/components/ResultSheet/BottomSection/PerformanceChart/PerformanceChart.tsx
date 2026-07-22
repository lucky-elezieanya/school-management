interface Props {
    svg: string;
  }
  
  export default function PerformanceChart({ svg }: Props) {
    if (!svg) {
      return null;
    }
  
    return (
      <div className="border-[0.5px] border-gray-400 rounded-md p-0 mt-0">
        <div
          className="
            w-full
            overflow-hidden
  
            [&>svg]:block
            [&>svg]:w-full
            [&>svg]:h-auto
            [&>svg]:max-w-full
          "
          dangerouslySetInnerHTML={{
            __html: svg,
          }}
        />
      </div>
    );
  }