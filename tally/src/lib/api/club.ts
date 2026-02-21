import axios from "axios";
import { Club } from "@prisma/client";

type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateClubInput = { name: string };

export const createClub = async (payload: CreateClubInput): Promise<Club> => {
  const res = await axios.post<ApiResponse<Club>>("/api/clubs", payload);
  return res.data.data;
};

export const getClubById = async (id: string): Promise<Club> => {
  const res = await axios.get<ApiResponse<Club>>(`/api/clubs?id=${encodeURIComponent(id)}`);
  return res.data.data;
};

export const getClubsByName = async (name: string): Promise<Club[]> => {
  const res = await axios.get<ApiResponse<Club[]>>(
    `/api/clubs?name=${encodeURIComponent(name)}`
  );
  return res.data.data;
};

export const getAllClubs = async (): Promise<Club[]> => {
  const res = await axios.get<ApiResponse<Club[]>>("/api/clubs");
  return res.data.data;
};

export const updateClub = async (
  id: string,
  updateData: Partial<Omit<Club, "id" | "createdAt" | "updatedAt">>
): Promise<Club> => {
  const res = await axios.put<ApiResponse<Club>>(
    `/api/clubs?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

export const deleteClub = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<Club>>(`/api/clubs?id=${encodeURIComponent(id)}`);
};