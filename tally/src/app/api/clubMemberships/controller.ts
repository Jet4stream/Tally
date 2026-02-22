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
    include: { user: true },
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


// SPECIAL BACKEND FUNCTIONS

export async function findTreasurerMembershipClubId(userId: string) {
  const treasurer = await prisma.clubMembership.findFirst({
    where: {
      userId,
      role: "TREASURER" as MembershipRole,
    },
    select: { clubId: true },
  });

  return treasurer?.clubId ?? null;
}

export async function findClubMembersWithUsers(clubId: string) {
  return prisma.clubMembership.findMany({
    where: { clubId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTreasurerClubMembersController(userId: string) {
  const clubId = await findTreasurerMembershipClubId(userId);

  if (!clubId) {
    return null; // route will handle 403
  }

  const memberships = await findClubMembersWithUsers(clubId);

  return {
    clubId,
    memberships, // includes user
    members: memberships.map((m) => ({
      userId: m.user.id,
      fullName: `${m.user.firstName} ${m.user.lastName}`.trim(),
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      membershipRole: m.role,
    })),
  };
}