import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const createBudgetSectionSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().min(1),
  definition: z.string().optional().nullable(),
  year: z.number().int().optional(),
});

export const updateBudgetSectionSchema = z.object({
  title: z.string().min(1).optional(),
  definition: z.string().optional().nullable(),
}).partial();

export type CreateBudgetSectionInput = z.infer<typeof createBudgetSectionSchema>;
export type UpdateBudgetSectionInput = z.infer<typeof updateBudgetSectionSchema>;

export async function postBudgetSectionController(input: CreateBudgetSectionInput) {
  const data = createBudgetSectionSchema.parse(input);

  return prisma.budgetSection.create({
    data: {
      clubId: data.clubId,
      title: data.title,
      definition: data.definition ?? null,
      ...(data.year !== undefined && { year: data.year }),
    },
  });
}

export async function getAllBudgetSectionsController() {
  return prisma.budgetSection.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneBudgetSectionController(id: string) {
  return prisma.budgetSection.findUnique({ where: { id } });
}

export async function getBudgetSectionsByClubIdController(
  clubId: string,
  year?: number
) {
  return prisma.budgetSection.findMany({
    where: {
      clubId,
      ...(year !== undefined && { year }), // conditional filter
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBudgetSectionController(id: string, input: UpdateBudgetSectionInput) {
  const data = updateBudgetSectionSchema.parse(input);

  return prisma.budgetSection.update({
    where: { id },
    data,
  });
}

export async function deleteBudgetSectionController(id: string) {
  return prisma.budgetSection.delete({ where: { id } });
}