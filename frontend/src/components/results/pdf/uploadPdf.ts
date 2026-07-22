import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import axios from "axios";

export async function uploadPdf({
  blob,

  snapshot,
}: {
  blob: Blob;

  snapshot: StudentResultSnapshot;
}) {
  const formData = new FormData();

  formData.append(
    "file",

    blob,

    `${snapshot.student.fullName}.pdf`,
  );

  formData.append(
    "student",

    snapshot.student.id.toString(),
  );

  formData.append(
    "term",

    snapshot.school.term.id.toString(),
  );

  formData.append(
    "session",

    snapshot.school.session.id.toString(),
  );

  await axios.post(
    "/api/results/student-result-pdfs/",

    formData,

    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
}
