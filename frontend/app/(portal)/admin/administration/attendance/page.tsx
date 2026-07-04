"use client";

import AttendanceComponent from "@/app/components/sections/AttendanceComponent";
import { apiAction, apiHeaders } from "@/app/lib/api";
import { StudentType } from "@/app/lib/types";
import { useState, useEffect } from "react";

export default function Attendance() {
	

	return (
		<div>
			<AttendanceComponent />
		</div>
	);
}
