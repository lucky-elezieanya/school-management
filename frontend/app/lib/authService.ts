import { jwtDecode } from "jwt-decode";

import { apiAction, BASE_URL, getActiveTermSession } from "./api";

import {
  decodeToken,
  getAccessToken,
  getTokens,
  isTokenExpired,
  logout,
  refreshAccessToken,
  setTokens,
} from "./auth";

import { JwtPayload } from "./types";

export async function login(username: string, password: string) {
  const response = await fetch(`${BASE_URL}/accounts/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Invalid username or password.");
  }

  setTokens(data);

  const decoded = jwtDecode<JwtPayload>(data.access);

  return {
    tokens: data,
    decoded,
  };
}

export async function fetchCurrentUser(userId: number) {
  const tokens = getAccessToken();
  if (!tokens) return;
  try {
    const response = await apiAction("accounts", "users", userId);

    return response;
  } catch (err) {
    console.error("FETCH ERROR:", err);
    throw err;
  }
}
export async function fetchCurrentTerm() {
  return getActiveTermSession();
}

export async function initializeSession() {
  const tokens = getTokens();

  if (!tokens?.access) {
    return null;
  }

  let access = tokens.access;

  if (isTokenExpired(access)) {
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      logout();
      return null;
    }

    access = refreshed;
  }

  const decoded = decodeToken<JwtPayload>(access);

  if (!decoded) {
    logout();
    return null;
  }

  const user = await fetchCurrentUser(decoded.user_id);

  return {
    user,
    decoded,
    tokens: {
      ...tokens,
      access,
    },
  };
}
