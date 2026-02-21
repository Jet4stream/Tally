import axios from "axios";
import { ClubMembership, MembershipRole } from "@prisma/client";

type ApiResponse<T> = {
  code: string;
  message?: string;
  data: T;
};

type CreateClubMembershipInput = {
  clubId: string;     // uuid
  userId: string;     // Clerk ID
  role?: MembershipRole; // TREASURER | MEMBER
};

/**
 * CREATE CLUB MEMBERSHIP
 * POST /api/clubMemberships
 */
export const createClubMembership = async (
  payload: CreateClubMembershipInput
): Promise<ClubMembership> => {
  const res = await axios.post<ApiResponse<ClubMembership>>(
    "/api/clubMemberships",
    payload
  );
  return res.data.data;
};

/**
 * GET CLUB MEMBERSHIP BY ID
 * GET /api/clubMemberships?id=
 */
export const getClubMembershipById = async (
  id: string
): Promise<ClubMembership> => {
  const res = await axios.get<ApiResponse<ClubMembership>>(
    `/api/clubMemberships?id=${encodeURIComponent(id)}`
  );
  return res.data.data;
};

/**
 * GET CLUB MEMBERSHIPS BY USER ID
 * GET /api/clubMemberships?userId=
 */
export const getClubMembershipsByUserId = async (
  userId: string
): Promise<ClubMembership[]> => {
  const res = await axios.get<ApiResponse<ClubMembership[]>>(
    `/api/clubMemberships?userId=${encodeURIComponent(userId)}`
  );
  return res.data.data;
};

/**
 * GET CLUB MEMBERSHIPS BY CLUB ID
 * GET /api/clubMemberships?clubId=
 */
export const getClubMembershipsByClubId = async (
  clubId: string
): Promise<ClubMembership[]> => {
  const res = await axios.get<ApiResponse<ClubMembership[]>>(
    `/api/clubMemberships?clubId=${encodeURIComponent(clubId)}`
  );
  return res.data.data;
};

/**
 * GET ALL CLUB MEMBERSHIPS
 * GET /api/clubMemberships
 */
export const getAllClubMemberships = async (): Promise<ClubMembership[]> => {
  const res = await axios.get<ApiResponse<ClubMembership[]>>(
    "/api/clubMemberships"
  );
  return res.data.data;
};

/**
 * UPDATE CLUB MEMBERSHIP
 * PUT /api/clubMemberships?id=
 */
export const updateClubMembership = async (
  id: string,
  updateData: Partial<Pick<ClubMembership, "role">>
): Promise<ClubMembership> => {
  const res = await axios.put<ApiResponse<ClubMembership>>(
    `/api/clubMemberships?id=${encodeURIComponent(id)}`,
    updateData
  );
  return res.data.data;
};

/**
 * DELETE CLUB MEMBERSHIP
 * DELETE /api/clubMemberships?id=
 */
export const deleteClubMembership = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<ClubMembership>>(
    `/api/clubMemberships?id=${encodeURIComponent(id)}`
  );
};