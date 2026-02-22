import axios from "axios";
import { ClubInvite, MembershipRole } from "@prisma/client";

type ApiResponse<T> = { code: string; message?: string; data: T };

type CreateInvitationInput = {
  clubId: string;
  userEmail: string;
  role?: MembershipRole;
  expiresAt: string | Date;
};

export const createClubInvite = async (
  payload: CreateInvitationInput
): Promise<ClubInvite> => {
  const res = await axios.post<ApiResponse<ClubInvite>>("/api/clubInvites", payload);
  return res.data.data;
};

export const getClubInviteById = async (id: string): Promise<ClubInvite> => {
  const res = await axios.get<ApiResponse<ClubInvite>>(
    `/api/clubInvites?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

export const getClubInvitesByClubId = async (clubId: string): Promise<ClubInvite[]> => {
  const res = await axios.get<ApiResponse<ClubInvite[]>>(
    `/api/clubInvites?clubId=${encodeURIComponent(clubId)}`
  );
  return res.data.data;
};

export const getClubInvitesByEmail = async (userEmail: string): Promise<ClubInvite[]> => {
  const res = await axios.get<ApiResponse<ClubInvite[]>>(
    `/api/clubInvites?userEmail=${encodeURIComponent(userEmail)}`
  );
  return res.data.data;
};

export const getAllClubInvites = async (): Promise<ClubInvite[]> => {
  const res = await axios.get<ApiResponse<ClubInvite[]>>("/api/clubInvites");
  return res.data.data;
};

export const updateClubInvite = async (
  id: string,
  updateData: Partial<Omit<ClubInvite, "id" | "clubId" | "userEmail" | "createdAt">>
): Promise<ClubInvite> => {
  const res = await axios.put<ApiResponse<ClubInvite>>(
    `/api/clubInvites?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

export const deleteClubInvite = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<ClubInvite>>(
    `/api/clubInvites?id=${encodeURIComponent(id)}`
  );
};

export const deleteClubInvitesByEmailAndClubId = async (email: string, clubId: string) => {
  const res = await axios.delete<ApiResponse<{ deletedCount: number }>>(
    `/api/clubInvites`,
    { params: { email, clubId } }
  );
  return res.data.data;
};