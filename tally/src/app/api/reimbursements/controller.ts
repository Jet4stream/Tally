import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ReimbursementStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ReimbursementWithPayee =
  Prisma.ReimbursementGetPayload<{
    include: {
      payee: { select: { id: true; firstName: true; lastName: true; email: true } };
    };
  }>;

export const createReimbursementSchema = z.object({
  clubId: z.string().uuid(),
  clubName: z.string().min(1),

  createdUserId: z.string().min(1),
  payeeUserId: z.string().min(1),

  budgetItemId: z.string().uuid().optional().nullable(),

  amountCents: z.number().int().positive(),
  description: z.string().min(1),

  status: z.enum(["SUBMITTED", "APPROVED", "PAID", "REJECTED"]).optional(),
  rejectionReason: z.string().optional().nullable(),

  submittedAt: z.coerce.date().optional(),
  receiptFileUrl: z.string().url().optional().nullable(),
  generatedFormPdfUrl: z.string().url().optional().nullable(),
  packetPdfUrl: z.string().url().optional().nullable(),

  reviewedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
});

export const updateReimbursementSchema = createReimbursementSchema
  .omit({ clubId: true, createdUserId: true })
  .partial();

export type CreateReimbursementInput = z.infer<typeof createReimbursementSchema>;
export type UpdateReimbursementInput = z.infer<typeof updateReimbursementSchema>;

export async function postReimbursementController(input: CreateReimbursementInput) {
  const data = createReimbursementSchema.parse(input);

  return prisma.reimbursement.create({
    data: {
      clubId: data.clubId,
      clubName: data.clubName,

      createdUserId: data.createdUserId,
      payeeUserId: data.payeeUserId,

      budgetItemId: data.budgetItemId ?? null,

      amountCents: data.amountCents,
      description: data.description,

      status: (data.status as ReimbursementStatus) ?? "SUBMITTED",
      rejectionReason: data.rejectionReason ?? null,

      submittedAt: data.submittedAt ?? new Date(),

      receiptFileUrl: data.receiptFileUrl ?? null,
      generatedFormPdfUrl: data.generatedFormPdfUrl ?? null,
      packetPdfUrl: data.packetPdfUrl ?? null,

      reviewedAt: data.reviewedAt ?? null,
      paidAt: data.paidAt ?? null,
    },
  });
}

export async function getAllReimbursementsController() {
  return prisma.reimbursement.findMany({ orderBy: { submittedAt: "desc" } });
}

export async function getOneReimbursementController(id: string) {
  return prisma.reimbursement.findUnique({ where: { id } });
}

export async function getReimbursementsByPayeeUserIdController(
  payeeUserId: string
): Promise<ReimbursementWithPayee[]> {
  return prisma.reimbursement.findMany({
    where: { payeeUserId },
    include: {
      payee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getReimbursementsByClubIdController(clubId: string): Promise<ReimbursementWithPayee[]> {
  return prisma.reimbursement.findMany({
    where: { clubId },
		include: {
      payee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function updateReimbursementController(id: string, input: UpdateReimbursementInput) {
  const data = updateReimbursementSchema.parse(input);

  return prisma.reimbursement.update({
    where: { id },
    data,
  });
}

export async function deleteReimbursementWithFilesController(id: string) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
  });

  if (!reimbursement) {
    throw new Error("Reimbursement not found");
  }

  const fileUrls = [
    reimbursement.receiptFileUrl,
    reimbursement.generatedFormPdfUrl,
    reimbursement.packetPdfUrl,
  ].filter(Boolean) as string[];

  const bucket = "reimbursements"; // your storage bucket name

  const filePaths = fileUrls.map((url) => {
    const parts = url.split(`${bucket}/`);
    return parts[1]; // path inside bucket
  });

  if (filePaths.length > 0) {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(filePaths);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error("Failed to delete reimbursement files");
    }
  }

  await prisma.reimbursement.delete({
    where: { id },
	});

  return { success: true };
}