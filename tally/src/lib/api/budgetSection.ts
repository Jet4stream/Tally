import axios from "axios";
import { BudgetSection } from "@prisma/client";

type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateBudgetSectionInput = {
  clubId: string;
  title: string;
  definition?: string | null;
};

export const createBudgetSection = async (
  payload: CreateBudgetSectionInput
): Promise<BudgetSection> => {
  const res = await axios.post<ApiResponse<BudgetSection>>("/api/budgetSections", payload);
  return res.data.data;
};

export const getBudgetSectionById = async (id: string): Promise<BudgetSection> => {
  const res = await axios.get<ApiResponse<BudgetSection>>(
    `/api/budgetSections?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

export const getBudgetSectionsByClubId = async (clubId: string): Promise<BudgetSection[]> => {
  const res = await axios.get<ApiResponse<BudgetSection[]>>(
    `/api/budgetSections?clubId=${encodeURIComponent(clubId)}`
  );
  return res.data.data;
};

export const getAllBudgetSections = async (): Promise<BudgetSection[]> => {
  const res = await axios.get<ApiResponse<BudgetSection[]>>("/api/budgetSections");
  return res.data.data;
};

export const updateBudgetSection = async (
  id: string,
  updateData: Partial<Omit<BudgetSection, "id" | "clubId" | "createdAt" | "updatedAt">>
): Promise<BudgetSection> => {
  const res = await axios.put<ApiResponse<BudgetSection>>(
    `/api/budgetSections?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

export const deleteBudgetSection = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<BudgetSection>>(
    `/api/budgetSections?id=${encodeURIComponent(id)}`
  );
};