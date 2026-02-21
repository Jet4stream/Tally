// Frontend API helper for /api/users

import axios from "axios";
import { User, GlobalRole } from "@prisma/client";

type ApiResponse<T> = {
  code: string;
  message?: string;
  data: T;
};

type CreateUserInput = {
  id: string; // Clerk ID
  firstName: string;
  lastName: string;
  email: string;
  role: GlobalRole;

  studentId: string;
  phoneNumber: string;

  permAddress1: string;
  permCity: string;
  permState: string;
  permZip: string;

  tempAddress1: string;
  tempCity: string;
  tempState: string;
  tempZip: string;
};

/**
 * CREATE USER
 */
export const createUser = async (
  payload: CreateUserInput
): Promise<User> => {
  const response = await axios.post<ApiResponse<User>>(
    "/api/users",
    payload
  );

  return response.data.data;
};

/**
 * GET USER BY ID
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await axios.get<ApiResponse<User>>(
    `/api/users?id=${encodeURIComponent(id)}`
  );

  return response.data.data;
};

/**
 * GET USER BY CLERK ID
 */
export const getUserByClerkId = async (
  clerkId: string
): Promise<User | null> => {
  const response = await axios.get<ApiResponse<User | null>>(
    `/api/users?clerkId=${encodeURIComponent(clerkId)}`
  );

  return response.data.data;
};

/**
 * GET USER BY EMAIL
 */
export const getUserByEmail = async (
  email: string
): Promise<User | null> => {
  const response = await axios.get<ApiResponse<User | null>>(
    `/api/users?email=${encodeURIComponent(email)}`
  );

  return response.data.data;
};

/**
 * GET USERS BY ROLE
 */
export const getUsersByRole = async (
  role: GlobalRole
): Promise<User[]> => {
  const response = await axios.get<ApiResponse<User[]>>(
    `/api/users?role=${role}`
  );

  return response.data.data;
};

/**
 * GET ALL USERS
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await axios.get<ApiResponse<User[]>>(
    "/api/users"
  );

  return response.data.data;
};

/**
 * UPDATE USER
 */
export const updateUser = async (
  id: string,
  updateData: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
): Promise<User> => {
  const response = await axios.put<ApiResponse<User>>(
    `/api/users?id=${encodeURIComponent(id)}`,
    updateData
  );

  return response.data.data;
};

/**
 * DELETE USER
 */
export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete<ApiResponse<User>>(
    `/api/users?id=${encodeURIComponent(id)}`
  );
};