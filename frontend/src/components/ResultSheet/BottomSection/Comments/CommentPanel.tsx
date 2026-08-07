import CommentCard from "./CommentCard";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";

interface CommentPanelProps {
  snapshot: StudentResultSnapshot;
}

export default function CommentPanel({ snapshot }: CommentPanelProps) {
  const { customization, comments } = snapshot;

  const showTeacher = customization.showTeacherComment;
  const showPrincipal = customization.showPrincipalComment;

  if (!showTeacher && !showPrincipal) {
    return null;
  }

  return (
    <div
      className="
        flex
        flex-col
        justify-between
        gap-4
        pr-4
       
      "
    >
      <div className="">
        {showTeacher && (
          <CommentCard
            title="Class Teacher's Comment"
            comment={comments.teacher.text}
            signature={comments.teacher.signature}
          />
        )}
      </div>
      <div className="">
        {showTeacher && showPrincipal && (
          <hr className="my-2 border-gray-300" />
        )}
      </div>
      <div className="">
        {showPrincipal && (
          <CommentCard
            title="HM/Principal's Comment"
            comment={comments.principal.text}
            signature={comments.principal.signature}
          />
        )}
      </div>
    </div>
  );
}
