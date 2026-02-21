import axios from "axios";
import { BudgetItem, BudgetCategory } from "@prisma/client";

type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateBudgetItemInput = {
  sectionId: string;
  label: string;
  category: BudgetCategory;
  allocatedCents: number;
  spentCents?: number;
  notes?: string | null;
};

export const createBudgetItem = async (payload: CreateBudgetItemInput): Promise<BudgetItem> => {
  const res = await axios.post<ApiResponse<BudgetItem>>("/api/budgetItems", payload);
  return res.data.data;
};

export const getBudgetItemById = async (id: string): Promise<BudgetItem> => {
  const res = await axios.get<ApiResponse<BudgetItem>>(
    `/api/budgetItems?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

export const getBudgetItemsBySectionId = async (sectionId: string): Promise<BudgetItem[]> => {
  const res = await axios.get<ApiResponse<BudgetItem[]>>(
    `/api/budgetItems?sectionId=${encodeURIComponent(sectionId)}`
  );
  return res.data.data;
};

export const getAllBudgetItems = async (): Promise<BudgetItem[]> => {
  const res = await axios.get<ApiResponse<BudgetItem[]>>("/api/budgetItems");
  return res.data.data;
};

export const updateBudgetItem = async (
  id: string,
  updateData: Partial<Omit<BudgetItem, "id" | "sectionId" | "createdAt" | "updatedAt">>
): Promise<BudgetItem> => {
  const res = await axios.put<ApiResponse<BudgetItem>>(
    `/api/budgetItems?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

export const deleteBudgetItem = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<BudgetItem>>(`/api/budgetItems?id=${encodeURIComponent(id)}`);
};