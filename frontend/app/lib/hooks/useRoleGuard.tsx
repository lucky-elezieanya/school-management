"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../auth";

export const useRoleGuard = (allowedRoles: string[]) => {
	const router = useRouter();
	useEffect(() => {
		const user = getCurrentUser();
		if (!user) {
			router.push("/login");
			return;
		}
		if (!allowedRoles.includes(user.role || "")) {
			router.push("/login");
		}
	}, [router, allowedRoles]);
};
