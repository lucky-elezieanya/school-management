"use client";

import HeadTeacherSignatureUploadComponent from "@/app/components/sections/HeaderTeacherSignatureUploadComponent";

export default function HeadTeacherSignaturePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Head Teacher Signature</h1>

        <p className="mt-1 text-sm text-gray-500">
          Upload the active Head Teacher's signature.
        </p>
      </div>

      <HeadTeacherSignatureUploadComponent />
    </div>
  );
}
