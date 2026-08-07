import Signature from "./Signature";

interface CommentCardProps {
  title: string;
  comment?: string;
  signature?: string | null;
}

export default function CommentCard({
  title,
  comment,
  signature,
}: CommentCardProps) {
  return (
    <div className="flex justify-between items-end gap-4">
      <div className="flex-1 w-[80%}">
        <h3
          className="
            text-[14px]
            italic
            font-bold
            text-[#0070c0]
            mb-1
          "
        >
          {title}
        </h3>
        <p
          className="
            text-[12px]
            italic
            text-[#333]
            leading-5
            min-h-[40px]
          "
        >
          {comment || "-"}
        </p>
      </div>
      <div className="bg-white h-[80px]">
        <Signature image={signature} />
      </div>
    </div>
  );
}
