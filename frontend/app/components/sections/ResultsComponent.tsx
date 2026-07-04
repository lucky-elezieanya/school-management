// app/dashboard/results/page.tsx
"use client";

import ClassesSidebar from "@/app/components/sections/ClassesSidebar";
import ResultEntryTable from "@/app/components/sections/ResultsEntryTable";
import SubjectsPanel from "@/app/components/sections/SubjectsPanel";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getWorkFlowApprovedStatus } from "@/app/services/results";
import { useEffect, useState } from "react";

export default function ResultsComponent() {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const { currentTerm } = useAuth();

  const [approvedStatus, setApprovedStatus] = useState<string>("");

  const getWorkFlowStatus = async (
    school_class: number,
    term: number,
    session: number,
  ) => {
    try {
      const res = await getWorkFlowApprovedStatus(school_class, term, session);
      if (res?.results?.length) {
        setApprovedStatus(res.results[0].status);
        console.log("status:  ", res);
      } else {
        setApprovedStatus("");
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  useEffect(() => {
    currentTerm &&
      selectedClass &&
      getWorkFlowStatus(
        selectedClass.id,
        currentTerm?.id,
        currentTerm?.session.id,
      );

    console.log("approved: ", approvedStatus);
  }, [selectedClass]);

  return (
    <div className="flex flex-col w-full bg-gray-50 overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b flex flex-col gap-4 relative bg-white stick top-0 z-10">
        <h2 className="font-bold text-gray-800 text-xl">Results Entry</h2>
        <p className="text-sm text-gray-500">Select class and subject</p>
        <div className="w-full relative lg:w-64 border-r bg-white  flex flex-col min-w-0">
          {/* SCROLLABLE CONTENT */}
        </div>
        <div className="flex-1 w-full space-y-6 min-w-0 mx-5">
          <div className="classes w-full border-b overflow-y-auto">
            {" "}
            <ClassesSidebar
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              setSelectedSubject={setSelectedSubject}
            />
            {!selectedClass && (
              <div className="text-sm text-gray-500">
                Select a class to continue
              </div>
            )}
          </div>
          <div className="subjects w-full border-b overflow-y-auto">
            {selectedClass && (
              <>
                <h2 className="text-xl font-bold mb-2 mx-auto p-4 z-10">
                  Subjects
                </h2>
                <SubjectsPanel
                  selectedClass={selectedClass}
                  setSelectedSubject={setSelectedSubject}
                  selectedSubject={selectedSubject}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full mx-0 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-2 border-b bg-white mb-2 w-3/4">
          {selectedSubject ? (
            <div className="w-fit flex flex-col">
              <h2 className="font-semibold text-gray-800">
                {selectedSubject.subject?.name} {selectedClass.name}
              </h2>
              <p className="text-sm text-gray-500">
                Enter continuous assessment and exam scores
              </p>
            </div>
          ) : (
            <h2 className="text-gray-500 text-sm">Select a subject to begin</h2>
          )}
        </div>
      </div>
      {/* TABLE AREA */}
      <div className="flex w-full">
        {selectedClass && selectedSubject ? (
          <div className="w-full">
            <ResultEntryTable
              subject={selectedSubject}
              selectedClass={selectedClass}
              approvedStatus={approvedStatus}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-sm">
            Select a class and subject to start entering results
          </div>
        )}
      </div>
    </div>
  );
}
