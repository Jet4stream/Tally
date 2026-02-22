import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { MembershipRole } from "@prisma/client";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  const invite = await prisma.clubInvite.create({
    data: {
      clubId: data.clubId,
      userEmail: data.userEmail,
      role: (data.role as MembershipRole) ?? "MEMBER",
      expiresAt: data.expiresAt,
    },
  });

  // Send invite email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: data.userEmail,
    subject: "You've been invited to join TCU Senate Tally!",
    html: `
      <h2>You've been invited to Tally!</h2>
      <p>A club treasurer has invited you to join their club on Tally.</p>
      <p>Create your account to get started:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/pages/signup" style="display:inline-block;padding:12px 24px;background:#3172AE;color:white;border-radius:8px;text-decoration:none;font-family:sans-serif;">
        Create Account
      </a>
    `,
  });

  return invite;
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

export async function deleteClubInvitesByEmailAndClubIdController(
  userEmail: string,
  clubId: string
) {
  const result = await prisma.clubInvite.deleteMany({
    where: {
      userEmail: userEmail.trim().toLowerCase(),
      clubId,
    },
  });

  return { deletedCount: result.count };
}