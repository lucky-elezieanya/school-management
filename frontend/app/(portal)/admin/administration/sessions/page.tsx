"use client";

import { useEffect, useState } from "react";
import { getSessions } from "@/app/services/academics";
import SessionTermSwitcher from "@/app/components/forms/SessionTermSwitcher";
import AddSessionForm from "@/app/components/forms/AddSession";
import { createAction, handleUserDelete } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { Trash2 } from "lucide-react";

export default function Sessions() {
  const { currentTerm } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);

  const [addSession, setAddSession] = useState(false);
  const [activeView, setActiveView] = useState<"create" | "toggle" | null>(
    null,
  );

  const [toggleSessionModal, setToggleSessionModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [sessions]);

  const handleSessionCreation = async (data: {
    name: string;
    is_active: boolean;
  }) => {
    try {
      const payload = {
        name: data.name.trim().toUpperCase(),
        is_active: data.is_active,
      };

      const res = await createAction("academics", "sessions", payload, "POST");

      if (!res) {
        throw new Error("Failed to create session");
      }
      await loadSessions();
      setActiveView(null);
    } catch (error: any) {
      console.error("Create session error:", error);
      throw error;
    }
  };
  const loadSessions = async () => {
    try {
      const res = await getSessions();

      if (res) {
        setSessions(res.results || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSessionDelete = async (session: any) => {
    try {
      const res = await handleUserDelete(
        "academics",
        "sessions",
        session.id,
        `Session ${session.name}`,
      );

      if (res) {
        alert(`Session: ${session.name} deleted successfully`);
      }
    } catch (error: any) {
      console.log(error);
      alert(`Could not delete this session: ${error.message}`);
    }
}

    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="text-lg font-semibold text-emerald-700 mb-4">
              Academic Sessions
            </h2>

            <div className="space-y-2 max-h-125 overflow-y-auto">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-3 hover:bg-emerald-50 transition flex flex-row justify-between"
                  >
                    <div className="font-medium">
                      <span>{session.name}</span>
                      {session.is_active && (
                        <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <button
                      className="text-red-500 bg-gray-50"
                      onClick={() => handleSessionDelete(session)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No sessions found.</div>
              )}
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="text-lg font-semibold text-emerald-700 mb-4">
              Session Actions
            </h2>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveView("create");
                }}
                className={`rounded-lg px-4 py-3 font-medium transition ${
                  activeView === "create"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                Create Session
              </button>

              <button
                type="button"
                onClick={() => setActiveView("toggle")}
                className={`rounded-lg px-4 py-3 font-medium transition ${
                  activeView === "toggle"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                Toggle Session
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white rounded-xl border  shadow-sm p-4">
            {activeView === null && (
              <div className="flex items-center justify-center h-full min-h-62.5 text-center text-gray-500">
                Select an action to continue
              </div>
            )}

            {activeView === "create" && (
              <AddSessionForm
                onCreate={handleSessionCreation}
                setAddSession={setAddSession}
              />
            )}

            {activeView === "toggle" && (
              <SessionTermSwitcher
                setToggleSessionModal={setToggleSessionModal}
              />
            )}
          </div>
        </div>
      </div>
    );
  }