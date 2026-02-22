import axios from "axios";
import { Reimbursement } from "@prisma/client";
import type { ReimbursementWithPayee } from "@/types/reimbursement";


type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateReimbursementInput = Omit<
  Reimbursement,
  "id" | "createdAt" | "updatedAt"
>;

export const createReimbursement = async (payload: {
  clubId: string;
  clubName: string;
  payeeUserId: string;
  budgetItemId?: string | null;
  amountCents: number;
  description: string;
  receiptFile?: File | null;
}): Promise<Reimbursement> => {
  const fd = new FormData();
  fd.append("clubId", payload.clubId);
  fd.append("clubName", payload.clubName);
  fd.append("payeeUserId", payload.payeeUserId);
  fd.append("amountCents", String(payload.amountCents));
  fd.append("description", payload.description);

  if (payload.budgetItemId) fd.append("budgetItemId", payload.budgetItemId);
  if (payload.receiptFile) fd.append("receipt", payload.receiptFile);

  const res = await axios.post<ApiResponse<Reimbursement>>("/api/reimbursements", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};
export const getReimbursementById = async (id: string): Promise<Reimbursement> => {
  const res = await axios.get<ApiResponse<Reimbursement>>(
    `/api/reimbursements?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

export const getReimbursementsByPayeeUserId = async (payeeUserId: string) => {
  const res = await axios.get<ApiResponse<ReimbursementWithPayee[]>>(
    `/api/reimbursements?payeeUserId=${encodeURIComponent(payeeUserId)}`
  );
  return res.data.data;
};

export const getReimbursementsByClubId = async (
  clubId: string
): Promise<ReimbursementWithPayee[]> => {
  const res = await axios.get<ApiResponse<ReimbursementWithPayee[]>>(
    `/api/reimbursements?clubId=${encodeURIComponent(clubId)}`
  );
  return res.data.data;
};

export const getAllReimbursements = async (): Promise<Reimbursement[]> => {
  const res = await axios.get<ApiResponse<Reimbursement[]>>("/api/reimbursements");
  return res.data.data;
};

export const updateReimbursement = async (
  id: string,
  updateData: Partial<Omit<Reimbursement, "id" | "createdAt" | "updatedAt">>
): Promise<Reimbursement> => {
  const res = await axios.put<ApiResponse<Reimbursement>>(
    `/api/reimbursements?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

export const deleteReimbursement = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<Reimbursement>>(
    `/api/reimbursements?id=${encodeURIComponent(id)}`
  );
};