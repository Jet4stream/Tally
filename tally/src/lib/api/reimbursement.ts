import axios from "axios";
import { Reimbursement } from "@prisma/client";

type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateReimbursementInput = Omit<
  Reimbursement,
  "id" | "createdAt" | "updatedAt"
>;

export const createReimbursement = async (
  payload: Partial<CreateReimbursementInput> & {
    clubId: string;
    clubName: string;
    createdUserId: string;
    payeeUserId: string;
    amountCents: number;
    description: string;
  }
): Promise<Reimbursement> => {
  const res = await axios.post<ApiResponse<Reimbursement>>("/api/reimbursements", payload);
  return res.data.data;
};

export const getReimbursementById = async (id: string): Promise<Reimbursement> => {
  const res = await axios.get<ApiResponse<Reimbursement>>(
    `/api/reimbursements?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

export const getReimbursementsByPayeeUserId = async (payeeUserId: string): Promise<Reimbursement[]> => {
  const res = await axios.get<ApiResponse<Reimbursement[]>>(
    `/api/reimbursements?payeeUserId=${encodeURIComponent(payeeUserId)}`
  );
  return res.data.data;
};

export const getReimbursementsByClubId = async (clubId: string): Promise<Reimbursement[]> => {
  const res = await axios.get<ApiResponse<Reimbursement[]>>(
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