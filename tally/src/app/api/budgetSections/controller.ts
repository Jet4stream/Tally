import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const createBudgetSectionSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().min(1),
  definition: z.string().optional().nullable(),
});

export const updateBudgetSectionSchema = createBudgetSectionSchema
  .omit({ clubId: true })
  .partial();

export type CreateBudgetSectionInput = z.infer<typeof createBudgetSectionSchema>;
export type UpdateBudgetSectionInput = z.infer<typeof updateBudgetSectionSchema>;

export async function postBudgetSectionController(input: CreateBudgetSectionInput) {
  const data = createBudgetSectionSchema.parse(input);

  return prisma.budgetSection.create({
    data: {
      clubId: data.clubId,
      title: data.title,
      definition: data.definition ?? null,
    },
  });
}

export async function getAllBudgetSectionsController() {
  return prisma.budgetSection.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneBudgetSectionController(id: string) {
  return prisma.budgetSection.findUnique({ where: { id } });
}

export async function getBudgetSectionsByClubIdController(clubId: string) {
  return prisma.budgetSection.findMany({
    where: { clubId },
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