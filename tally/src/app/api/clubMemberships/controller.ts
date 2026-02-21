import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { MembershipRole } from "@prisma/client";

export const createClubMembershipSchema = z.object({
  clubId: z.string().trim().min(1),
  userId: z.string().min(1), // Clerk ID
  role: z.enum(["TREASURER", "MEMBER"]).optional(),
});

export const updateClubMembershipSchema = createClubMembershipSchema
  .omit({ clubId: true, userId: true })
  .partial();

export type CreateClubMembershipInput = z.infer<typeof createClubMembershipSchema>;
export type UpdateClubMembershipInput = z.infer<typeof updateClubMembershipSchema>;

export async function postClubMembershipController(input: CreateClubMembershipInput) {
  const data = createClubMembershipSchema.parse(input);

  return prisma.clubMembership.create({
    data: {
      clubId: data.clubId,
      userId: data.userId,
      role: (data.role as MembershipRole) ?? "MEMBER",
    },
  });
}

export async function getAllClubMembershipsController() {
  return prisma.clubMembership.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneClubMembershipController(id: string) {
  return prisma.clubMembership.findUnique({ where: { id } });
}

export async function getClubMembershipsByUserIdController(userId: string) {
  return prisma.clubMembership.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClubMembershipsByClubIdController(clubId: string) {
  return prisma.clubMembership.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateClubMembershipController(id: string, input: UpdateClubMembershipInput) {
  const data = updateClubMembershipSchema.parse(input);

  return prisma.clubMembership.update({
    where: { id },
    data,
  });
}

export async function deleteClubMembershipController(id: string) {
  return prisma.clubMembership.delete({ where: { id } });
}