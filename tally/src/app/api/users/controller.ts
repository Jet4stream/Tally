import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { GlobalRole } from "@prisma/client";

export const createUserSchema = z.object({
  id: z.string().min(1), // Clerk ID
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["TCU_TREASURER", "STANDARD"]).optional(),

  studentId: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),

  permAddress1: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permState: z.string().optional().nullable(),
  permZip: z.string().optional().nullable(),

  tempAddress1: z.string().optional().nullable(),
  tempCity: z.string().optional().nullable(),
  tempState: z.string().optional().nullable(),
  tempZip: z.string().optional().nullable(),
});

export const updateUserSchema = createUserSchema
  .omit({ id: true })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function postUserController(input: CreateUserInput) {
  const data = createUserSchema.parse({
    ...input,
    email: input.email.toLowerCase(),
  });

  return prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      role: (data.role as GlobalRole) ?? "STANDARD",

      studentId: data.studentId ?? null,
      phoneNumber: data.phoneNumber ?? null,

      permAddress1: data.permAddress1 ?? null,
      permCity: data.permCity ?? null,
      permState: data.permState ?? null,
      permZip: data.permZip ?? null,

      tempAddress1: data.tempAddress1 ?? null,
      tempCity: data.tempCity ?? null,
      tempState: data.tempState ?? null,
      tempZip: data.tempZip ?? null,
    },
  });
}

export async function getAllUsersController() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneUserController(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByClerkIdController(clerkId: string) {
  // In your schema, id IS the Clerk ID, so this is the same as getOneUserController.
  return prisma.user.findUnique({ where: { id: clerkId } });
}

export async function getUserByEmailController(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function getUsersByRoleController(role: GlobalRole) {
  return prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserController(id: string, input: UpdateUserInput) {
  const data = updateUserSchema.parse(input);
  if (typeof data.email === "string") data.email = data.email.toLowerCase();

  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUserController(id: string) {
  return prisma.user.delete({ where: { id } });
}


