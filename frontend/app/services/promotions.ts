import {
	BASE_URL,
	apiHeaders,
	handleUserDelete,
	apiAction,
	createAction,
	updateAction,
} from "@/app/lib/api";

/* =====================================================
   PROMOTION RULES
===================================================== */

export const getPromotionRules = async () => {
	const res = await apiAction("academics", "promotion-rules");
	return res;
};

export const createPromotionRule = async (payload: any) => {
	const res = await createAction("academics", "promotion-rules", payload);
	if (res) alert("Promotion rule set successfully!");
	return res;
};

export const updatePromotionRule = async (id: number, payload: any) => {
	const res = await updateAction(
		"academics",
		"promotion-rules",
		id,
		payload,
		"PATCH",
	);
	if (res) alert("Promotion rule updated successfully!");
	return res;
};

export const deletePromotionRule = async (
	id: number,
	promotionName: string,
) => {
	const res = handleUserDelete(
		"academics",
		"promotion-rules",
		id,
		promotionName,
	);
	if (!res) alert("Failed to delete promotion rule");
	return res;
};

/* =====================================================
   PROMOTION BATCHES
===================================================== */

export const getPromotionBatches = async () => {
	return await apiAction("academics", "promotion-batch");
};

export const createPromotionBatch = async (payload: any) => {
	return await createAction("academics", "promotion-batch", payload);
};

/* =====================================================
   BATCH OPERATIONS
===================================================== */

export const getPromotionPreview = async (batchId: number) => {
	const res = await apiAction(
		"academics",
		`promotion-batch/${batchId}/preview`,
		undefined,
		"GET",
	);
	return res;
};

export const getPromotionStudents = async (batchId: number) => {
	const res = await apiAction(
		"academics",
		`promotion-batch/${batchId}/students`,
		undefined,
		"GET",
	);
	return res;
};

/* =====================================================
   EXECUTION ACTIONS
===================================================== */

export const executePromotion = async (batchId: number) => {
	const res = await apiAction(
		"academics",
		`promotion-batch/${batchId}/execute`,
		undefined,
		"POST",
	);
	return res;
};

export const repeatStudent = async (batchId: number, studentId: number) => {
	try {
		const payload = {
			student: studentId,
		};
		const res = await createAction(
			"academics",
			`promotion-batch/${studentId}/repeat_student`,
			payload,
		);
		if (res) {
			return res;
		}
	} catch (error) {
		return error;
	}
};

export const graduateStudent = async (batchId: number, studentId: number) => {
	try {
		const payload = {
			student: studentId,
		};
		const res = await createAction(
			"academics",
			`promotion-batch/${batchId}/graduate_student`,
			payload,
		);
		if (res) {
			return res;
		}
	} catch (error) {
		return error;
	}
};

export const transferStudent = async (
	batchId: number,
	studentId: number,
	newClassId: number,
) => {
	try {
		const payload = {
			student: studentId,
			new_class: newClassId,
		};
		const res = await createAction(
			"academics",
			`promotion-batch/${batchId}/transfer_student`,
			payload,
		);
		if (res) {
			return res;
		}
	} catch (error) {
		throw error;
	} finally {
	}
};

/* =====================================================
   PROMOTION RECORDS
===================================================== */

export const getPromotionRecords = async () => {
	const res = await fetch(`${BASE_URL}/academics/promotion-record/`, {
		headers: apiHeaders(),
	});
	const response = await res.json();
	if (!res.ok) throw response.details;

	return response;
};
