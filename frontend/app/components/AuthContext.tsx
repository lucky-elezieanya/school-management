"use client";

import { jwtDecode } from "jwt-decode";
import { createContext, useState, ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { BASE_URL, getActiveTermSession } from "../lib/api";

import {
  getTokens,
  isTokenExpired,
  logout,
  refreshAccessToken,
  setTokens,
  decodeToken,
} from "../lib/auth";

import { JwtPayload } from "../lib/types";

type TermSession = {
  id: number;
  name: string;
  is_active: boolean;
  session: {
    name: string;
    id: number;
    is_active: boolean;
  };
};

type AuthContextType = {
  loginUser: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

  loading: boolean;
  error: string | null;
  logo: string | null;

  user: any;

  authToken: {
    access: string;
    refresh: string;
  };

  authLoading: boolean;

  currentTerm: TermSession | null;

  setCurrentTerm: React.Dispatch<React.SetStateAction<TermSession | null>>;

  termMessage: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [logo, setLogo] = useState<any>(null);

  const [authToken, setAuthToken] = useState({
    access: "",
    refresh: "",
  });

  const [loading, setLoading] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);

  const [termSession, setTermSession] = useState<TermSession | null>(null);

  const [termMessage, setTermMessage] = useState("");

  const [error, setError] = useState<string | null>(null);

  /* =========================
	   FETCH USER
	========================= */

  const fetchUser = async (userId: number, accessToken: string) => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to fetch user");
      }

      setUser(data);

      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  };


  /* =========================
	   ACTIVE TERM
	========================= */

  const activeTerm = async () => {
    try {
      const res = await getActiveTermSession();

      if (!res) {
        setTermMessage("No term has been configured yet.");
        return;
      }

      setTermSession(res);

      setTermMessage("");
    } catch {
      setTermMessage("Unable to load session.");
    }
  };

  /* =========================
	   LOGIN
	========================= */

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const form = e.currentTarget;

      const response = await fetch(`${BASE_URL}/accounts/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: (form.elements.namedItem("username") as HTMLInputElement)
            .value,
          password: (form.elements.namedItem("password") as HTMLInputElement)
            .value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Invalid credentials");
      }
      setTokens(data);
      setAuthToken(data);

      const decoded: JwtPayload = jwtDecode(data.access);

      await activeTerm();
      await fetchUser(decoded.user_id, data.access);

      switch (decoded.role) {
        case "admin":
          router.replace("/admin");
          break;

        case "teacher":
          router.replace("/teachers");
          break;

        case "student":
          router.replace("/students");
          break;

        default:
          router.replace("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
	   INITIALIZE AUTH
	========================= */
  const initializeAuth = async () => {
    try {
      setAuthLoading(true);

      const tokens = getTokens();

      if (!tokens?.access) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      let accessToken = tokens.access;

      if (isTokenExpired(accessToken)) {
        const newAccess = await refreshAccessToken();

        if (!newAccess) {
          logout();
          setUser(null);
          return;
        }

        accessToken = newAccess;
      }

      setAuthToken({
        ...tokens,
        access: accessToken,
      });

      const decoded = decodeToken<JwtPayload>(accessToken);

      if (!decoded) {
        logout();
        setUser(null);
        return;
      }

      const userData = await fetchUser(decoded.user_id, accessToken);

      if (!userData) {
        logout();
        setUser(null);
        return;
      }
      setUser(userData);
      await activeTerm();
    } catch (err) {
      console.error("Auth init error:", err);
      logout();
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };
  /* =========================
	   AUTO REFRESH TOKEN
	========================= */

  useEffect(() => {
    const interval = setInterval(async () => {
      const tokens = getTokens();

      if (!tokens?.access) return;

      const decoded: any = decodeToken(tokens.access);

      if (!decoded?.exp) return;

      const expiryTime = decoded.exp * 1000;

      const timeLeft = expiryTime - Date.now();

      /*
					Refresh 5 mins before expiry
				*/
      if (timeLeft < 5 * 60 * 1000) {
        const newAccess = await refreshAccessToken();

        if (!newAccess) {
          logout();
          return;
        }

        setAuthToken((prev) => ({
          ...prev,
          access: newAccess,
        }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /* =========================
	   INIT
	========================= */

  useEffect(() => {
    initializeAuth();
  }, []);

  const contextData: AuthContextType = {
    loginUser,
    loading,
    error,
    logo,
    user,
    authToken,
    authLoading,
    currentTerm: termSession,
    setCurrentTerm: setTermSession,
    termMessage,
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};
