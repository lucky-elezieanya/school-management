"use client";
import { toast } from "sonner";
import { createContext, useEffect, useState, ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  getTokens,
  logout,
  refreshAccessToken,
  decodeToken,
} from "../lib/auth";

import { JwtPayload, UserType } from "../lib/types";
import {
  fetchCurrentTerm,
  fetchCurrentUser,
  initializeSession,
  login,
} from "../lib/authService";

type TermSession = {
  id: number;
  name: string;
  is_active: boolean;
  session: {
    id: number;
    name: string;
    is_active: boolean;
  };
};

type AuthTokens = {
  access: string;
  refresh: string;
};

type AuthContextType = {
  loginUser: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

  loading: boolean;
  authLoading: boolean;

  error: string | null;

  user: UserType | null;
  authToken: AuthTokens;

  currentTerm: TermSession | null;
  setCurrentTerm: React.Dispatch<React.SetStateAction<TermSession | null>>;

  termMessage: string;
  pdfDOMRef: React.RefObject<HTMLElement | null>;
  setPdfDOMElement: (node: HTMLElement | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);

  const [authToken, setAuthToken] = useState<AuthTokens>({
    access: "",
    refresh: "",
  });

  const [loading, setLoading] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [currentTerm, setCurrentTerm] = useState<TermSession | null>(null);

  const [termMessage, setTermMessage] = useState("");

  const pdfDOMRef = useRef<HTMLElement | null>(null);

  // Define a reactive callback that sub-components use to mount/unmount elements
  const setPdfDOMElement = (node: HTMLElement | null) => {
    pdfDOMRef.current = node;
  };

  /* =============LOGIN============== */

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const form = e.currentTarget;

      const username = (form.elements.namedItem("username") as HTMLInputElement)
        .value;

      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;

      const { tokens, decoded } = await login(username, password);

      if (decoded && tokens) {
        setAuthToken(tokens);

        const user = await fetchCurrentUser(decoded.user_id);
        setUser(user);

        const term = await fetchCurrentTerm();
        setCurrentTerm(term);
      }

      router.replace(
        decoded.role === "admin"
          ? "/admin"
          : decoded.role === "teacher"
            ? "/teachers"
            : "/students",
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  /* =====================================================
   INITIALIZE AUTH
===================================================== */

  const initializeAuth = async () => {
    try {
      setAuthLoading(true);

      const session = await initializeSession();

      if (!session) {
        setUser(null);
        return;
      }

      setUser(session.user);

      setAuthToken(session.tokens);

      const term = await fetchCurrentTerm();

      setCurrentTerm(term);
    } finally {
      setAuthLoading(false);
    }
  };
  /* ================== INITIALIZE AUTH ========================= */

  useEffect(() => {
    initializeAuth();
  }, []);

  /* ================= AUTO REFRESH ACCESS TOKEN ========== */

  useEffect(() => {
    const interval = setInterval(async () => {
      const tokens = getTokens();

      if (!tokens?.access) return;

      const decoded = decodeToken<JwtPayload>(tokens.access);

      if (!decoded?.exp) return;

      const expiresIn = decoded.exp * 1000 - Date.now();

      // Refresh 5 minutes before expiry
      if (expiresIn <= 5 * 60 * 1000) {
        const newAccess = await refreshAccessToken();

        if (!newAccess) {
          logout();
          setUser(null);
          return;
        }

        setAuthToken((prev) => ({
          ...prev,
          access: newAccess,
        }));

        // Refresh user information with the new token
        await fetchCurrentUser(decoded.user_id);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [authToken]);

  const contextData: AuthContextType = {
    loginUser,
    loading,
    error,

    user: user,
    authToken,
    authLoading,
    currentTerm: currentTerm,
    setCurrentTerm: setCurrentTerm,
    termMessage,
    pdfDOMRef,
    setPdfDOMElement,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};
