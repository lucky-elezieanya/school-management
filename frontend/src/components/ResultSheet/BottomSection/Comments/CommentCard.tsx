import { toMultiSentenceCase } from "@/app/services/results";
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
    <div className="flex justify-between items-end gap-1">
      <div className="flex-1 w-[60%]">
        <h3
          className="
            text-[12px]
            italic
            font-bold
            text-[#0070c0]
            mb-1
          "
        >
          {toMultiSentenceCase(title)}
        </h3>
        <p
          className="
            text-[11px]
            italic
            text-[#333]
            leading-5
            min-h-[30px]
          "
        >
          {toMultiSentenceCase(comment || "-")}
        </p>
      </div>
      <div className="bg-white h-[60px]">
        <Signature image={signature} />
      </div>
    </div>
  );
}
