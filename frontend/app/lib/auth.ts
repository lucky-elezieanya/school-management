import { BASE_URL } from "./api";
import { JwtPayload, AuthTokens } from "./types";

const AUTH_STORAGE_KEY = "authTokens";

/* =========================
   SAVE TOKENS
========================= */

export const setTokens = (tokens: AuthTokens): void => {
	if (typeof window === "undefined") return;

	sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
};

/* =========================
   GET TOKENS
========================= */

export const getTokens = (): AuthTokens | null => {
	if (typeof window === "undefined") return null;

	const storedTokens = sessionStorage.getItem(AUTH_STORAGE_KEY);

	if (!storedTokens) return null;

	try {
		return JSON.parse(storedTokens);
	} catch {
		return null;
	}
};

/* =========================
   GET ACCESS TOKEN
========================= */

export const getAccessToken = (): string | null => {
	const tokens = getTokens();
	return tokens?.access || null;
};

/* =========================
   GET REFRESH TOKEN
========================= */

export const getRefreshToken = (): string | null => {
	const tokens = getTokens();
	return tokens?.refresh || null;
};

/* =========================
   CLEAR TOKENS
========================= */

export const clearTokens = (): void => {
	if (typeof window === "undefined") return;

	sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

/* =========================
   JWT DECODE
========================= */

export const decodeToken = <T = any>(token: string): T | null => {
	try {
		const payload = token.split(".")[1];

		return JSON.parse(atob(payload));
	} catch {
		return null;
	}
};

/* =========================
   CURRENT USER
========================= */

export const getCurrentUser = (): JwtPayload | null => {
	const token = getAccessToken();

	if (!token) return null;

	return decodeToken<JwtPayload>(token);
};

/* =========================
   TOKEN EXPIRY
========================= */

export const isTokenExpired = (token: string): boolean => {
	const decoded = decodeToken<any>(token);

	if (!decoded?.exp) return true;

	return decoded.exp < Date.now() / 1000;
};

/* =========================
   REFRESH ACCESS TOKEN
========================= */

export const refreshAccessToken = async (): Promise<string | null> => {
	const refresh = getRefreshToken();

	if (!refresh) return null;

	try {
		const response = await fetch(
			`${BASE_URL}/accounts/token/refresh/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					refresh,
				}),
			},
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error("Refresh failed");
		}

		const currentTokens = getTokens();

		if (!currentTokens) return null;

		const updatedTokens: AuthTokens = {
			...currentTokens,
			access: data.access,
		};

		setTokens(updatedTokens);

		return data.access;
	} catch {
		clearTokens();
		return null;
	}
};

/* =========================
   AUTH HEADER
========================= */

export const getAuthHeader = (): HeadersInit => {
	const token = getAccessToken();

	return {
		"Content-Type": "application/json",
		Authorization: token ? `Bearer ${token}` : "",
	};
};

/* =========================
   LOGIN
========================= */

export const login = (tokens: AuthTokens): void => {
	setTokens(tokens);
};

/* =========================
   LOGOUT
========================= */

export const logout = (): void => {
	clearTokens();

	if (typeof window !== "undefined") {
		window.location.href = "/login";
	}
};
