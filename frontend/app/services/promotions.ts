import {
	BASE_URL,
	apiHeaders,
	handleUserDelete,
	apiAction,
	createAction,
	updateAction,
} from "@/app/lib/api";


// =====================================================
// PROMOTION RULES
// =====================================================

// =====================================================
// GET ALL CLASSES
// =====================================================

export async function getPromotionClasses() {
  return await apiAction("academics", "classes");
}

// =====================================================
// GET PROMOTION RULES
// =====================================================

export async function getPromotionRules() {
  return await apiAction("academics", "promotion-rules");
}

// =====================================================
// BULK SAVE PROMOTION RULES
// =====================================================

export type PromotionRulePayload = {
  id?: number;

  from_class_id: number;

  to_class_id: number | null;

  outcome: "PROMOTE" | "GRADUATE";

  is_active: boolean;
};

export async function bulkSavePromotionRules(data: PromotionRulePayload[]) {
  const response = await fetch(
    `${BASE_URL}/academics/promotion-rules/bulk-upsert/`,
    {
      method: "POST",

      headers: {
        ...apiHeaders(),
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    let message = "Failed to save promotion rules.";

    if (typeof result?.message === "string") {
      message = result.message;
    } else if (typeof result?.detail === "string") {
      message = result.detail;
    } else if (Array.isArray(result)) {
      message = result
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .join(", ");
    } else if (result && typeof result === "object") {
      message = JSON.stringify(result);
    }

    throw new Error(message);
  }

  return result;
}

// =====================================================
// CREATE
// =====================================================

export const createPromotionRule = async (payload: any) => {
  const res = await createAction("academics", "promotion-rules", payload);

  if (res) {
    alert("Promotion rule set successfully!");
  }

  return res;
};

// =====================================================
// UPDATE
// =====================================================

export const updatePromotionRule = async (id: number, payload: any) => {
  const res = await updateAction(
    "academics",
    "promotion-rules",
    id,
    payload,
    "PATCH",
  );

  if (res) {
    alert("Promotion rule updated successfully!");
  }

  return res;
};

// =====================================================
// DELETE
// =====================================================

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

  if (!res) {
    alert("Failed to delete promotion rule");
  }

  return res;
};

// =====================================================
// PROMOTION BATCHES
// =====================================================

export const getPromotionBatches = async () => {
  return await apiAction("academics", "promotion-batch");
};

export const createPromotionBatch = async (payload: any) => {
  return await createAction("academics", "promotion-batch", payload);
};

// =====================================================
// PREVIEW
// =====================================================

export const getPromotionPreview = async (batchId: number) => {
  return await apiAction(
    "academics",
    `promotion-batch/${batchId}/preview`,
    undefined,
    "GET",
  );
};

// =====================================================
// STUDENTS
// =====================================================

export const getPromotionStudents = async (batchId: number) => {
  return await apiAction(
    "academics",
    `promotion-batch/${batchId}/students`,
    undefined,
    "GET",
  );
};

// =====================================================
// EXECUTE
// =====================================================

export const executePromotion = async (batchId: number) => {
  return await apiAction(
    "academics",
    `promotion-batch/${batchId}/execute`,
    undefined,
    "POST",
  );
};

// =====================================================
// REPEAT STUDENT
// =====================================================

export const repeatStudent = async (batchId: number, studentId: number) => {
  const payload = {
    student: studentId,
  };

  return await createAction(
    "academics",
    `promotion-batch/${batchId}/repeat_student`,
    payload,
  );
};

// =====================================================
// GRADUATE STUDENT
// =====================================================

export const graduateStudent = async (batchId: number, studentId: number) => {
  const payload = {
    student: studentId,
  };

  return await createAction(
    "academics",
    `promotion-batch/${batchId}/graduate_student`,
    payload,
  );
};

// =====================================================
// TRANSFER STUDENT
// =====================================================

export const transferStudent = async (
  batchId: number,
  studentId: number,
  newClassId: number,
) => {
  const payload = {
    student: studentId,
    new_class: newClassId,
  };

  return await createAction(
    "academics",
    `promotion-batch/${batchId}/transfer_student`,
    payload,
  );
};

// =====================================================
// PROMOTION RECORDS
// =====================================================

export const getPromotionRecords = async () => {
  const res = await fetch(`${BASE_URL}/academics/promotion-record/`, {
    headers: apiHeaders(),
  });

  const response = await res.json();

  if (!res.ok) {
    throw new Error(
      response?.detail ||
        response?.message ||
        "Failed to load promotion records.",
    );
  }

  return response;
};

