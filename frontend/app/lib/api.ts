import { ConfirmToast } from "../components/ConfirmToast";
import { getAccessToken } from "./auth";
import { getTokens, logout } from "./auth";
import {toast} from "sonner"

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000/api";

export const handleResponse = async (res: Response) => {
	let data: any = null;

	try {
		data = await res.json();
	} catch {
		data = null;
	}

	if (!res.ok) {
		const message =
			data?.detail ||
			data?.message ||
			Object.values(data || {})
				.flat()
				.join(", ") ||
			`Request failed with status ${res.status}`;

		throw new Error(message);
	}

	return data;
};

export async function request(endpoint: string, options: RequestInit = {}) {
	const tokens = getTokens();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};

	if (tokens?.access) {
		headers.Authorization = `Bearer ${tokens.access}`;
	}

	const res = await fetch(`${BASE_URL}${endpoint}`, {
		...options,
		headers,
	});

	// Auto logout on auth failure
	if (res.status === 401) {
		logout();
		window.location.href = "/login";
		return;
	}

	const data = await res.json().catch(() => null);

	if (!res.ok) {
		throw new Error(data?.detail || "Something went wrong");
	}

	return data;
}

export const apiHeaders = () => ({
	Authorization: `Bearer ${getAccessToken()}`,
});

export const uploadFile = async (file: File, url?: string) => {
	const formData = new FormData();
    const token = getAccessToken()
	formData.append("file", file);
	const route_url = url ? url : `${BASE_URL}/academics/upload/`;
	try {
		const res = await fetch(route_url, {
			method: "POST",
			headers: apiHeaders(),
			body: formData,
		});

		const contentType = res.headers.get("content-type");

		let response;

		if (contentType && contentType.includes("application/json")) {
			response = await res.json();
		} else {
			const text = await res.text();

			throw {
				error: "Server returned non-JSON response",
				details: text,
			};
		}

		if (!res.ok) {
			throw response;
		}

		return response;
	} catch (error) {
		throw error;
	}
};

export const createAction = async (
	base_name: string,
	route_name: string,
	data: any,
	method?: string,
) => {
	const formData = new FormData();

	Object.entries(data).forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			formData.append(key, value as string | Blob);
		}
	});

	try {
		const res = await fetch(`${BASE_URL}/${base_name}/${route_name}/`, {
			method: method ? method : "POST",
			headers: {
				Authorization: `Bearer ${getAccessToken()}`,
			},
			body: formData,
		});
		const response = await res.json();
		if (!res.ok) {
			throw response;
		}
		return response;
	} catch (error) {
		throw error;
	}
};

export const apiAction = async (
	api_base: string,
	route_name: string,
	id?: number,
	method?: string,
) => {
	const url = id
		? `${BASE_URL}/${api_base}/${route_name}/${id}/`
		: `${BASE_URL}/${api_base}/${route_name}/`;
	const res = await fetch(url, {
		method: method || "GET",
		headers: apiHeaders(),
	});

	if (!res) {
		throw alert("Failed to perform action");
	}
	const response = await res.json();
	return response;
};

export const updateAction = async (
	base_name: string,
	route_name: string,
	id: number,
	data: any,
	method?: string,
) => {
	const url = `${BASE_URL}/${base_name}/${route_name}/${id}/`;
	const formData = new FormData();
	Object.entries(data).forEach(([key, value]) => {
		if (value !== null && value !== undefined) {
			formData.append(key, value as string | Blob);
		}
	});
    const token = getAccessToken();
	const res = await fetch(url, {
		method: method ? method : "PUT",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});
	const response = await res.json();
	if (!res.ok) {
		throw response;
	}

	return response;
};


export const handleUserDelete = async (
    route_base: string,
    route_name: string,
    id: number,
    item_name?: string,
  ) => {
    const confirmed = await ConfirmToast(
      "Delete Item",
      `Are you sure you want to delete this ${item_name ?? "item"}? This action cannot be undone.`,
    );
  
    if (!confirmed) return false;
  
    const url = `${BASE_URL}/${route_base}/${route_name}/${id}/`;
  
    const res = await fetch(url, {
      method: "DELETE",
      headers: apiHeaders(),
    });
  
    if (!res.ok) {
      toast.error(`Could not delete ${item_name ?? "item"}. Please try again.`);
    }
  
    return true;
  };

export const getActiveTermSession = async () => {
	const res = await fetch(`${BASE_URL}/academics/terms/active/`, {
		headers: apiHeaders()
	});
	const response = await res.json();
	if (!res.ok) {
		throw response;
	}
	return response;
};
export const getUser = async (userId:number) => {
	const res = await fetch(`${BASE_URL}/accounts/users/${userId}/`, {
		headers: apiHeaders()
	});
	return handleResponse(res);
};


export const fetchClasses = async () => {
	const res = await fetch(`${BASE_URL}/academics/classes/`, {
		headers: apiHeaders()
	});
	return handleResponse(res)
};
