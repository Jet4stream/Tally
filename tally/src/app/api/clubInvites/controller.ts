import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { MembershipRole } from "@prisma/client";

export const createClubInviteSchema = z.object({
  clubId: z.string().trim().min(1),
  userEmail: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["TREASURER", "MEMBER"]).optional(),
  expiresAt: z.coerce.date(),
});

export const updateClubInviteSchema = createClubInviteSchema
  .omit({ clubId: true, userEmail: true })
  .partial();

export type CreateClubInviteInput = z.infer<typeof createClubInviteSchema>;
export type UpdateClubInviteInput = z.infer<typeof updateClubInviteSchema>;

export async function postClubInviteController(input: CreateClubInviteInput) {
  const data = createClubInviteSchema.parse({
    ...input,
    userEmail: input.userEmail.toLowerCase(),
  });

  return prisma.clubInvite.create({
    data: {
      clubId: data.clubId,
      userEmail: data.userEmail,
      role: (data.role as MembershipRole) ?? "MEMBER",
      expiresAt: data.expiresAt,
    },
  });
}

export async function getAllClubInvitesController() {
  return prisma.clubInvite.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneClubInviteController(id: string) {
  return prisma.clubInvite.findUnique({ where: { id } });
}

export async function getClubInvitesByClubIdController(clubId: string) {
  return prisma.clubInvite.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClubInvitesByEmailController(userEmail: string) {
  return prisma.clubInvite.findMany({
    where: { userEmail: userEmail.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateClubInviteController(id: string, input: UpdateClubInviteInput) {
  const data = updateClubInviteSchema.parse(input);

  return prisma.clubInvite.update({
    where: { id },
    data,
  });
}

export async function deleteClubInviteController(id: string) {
  return prisma.clubInvite.delete({ where: { id } });
}