import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { BudgetCategory } from "@prisma/client";

export const createBudgetItemSchema = z.object({
  sectionId: z.string().uuid(),
  label: z.string().min(1),
  category: z.enum(["FOOD", "NONFOOD"]),
  allocatedCents: z.number().int().nonnegative(),
  spentCents: z.number().int().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

export const updateBudgetItemSchema = createBudgetItemSchema
  .omit({ sectionId: true })
  .partial();

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;

export async function postBudgetItemController(input: CreateBudgetItemInput) {
  const data = createBudgetItemSchema.parse(input);

  return prisma.budgetItem.create({
    data: {
      sectionId: data.sectionId,
      label: data.label,
      category: data.category as BudgetCategory,
      allocatedCents: data.allocatedCents,
      spentCents: data.spentCents ?? 0,
      notes: data.notes ?? null,
    },
  });
}

export async function getAllBudgetItemsController() {
  return prisma.budgetItem.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneBudgetItemController(id: string) {
  return prisma.budgetItem.findUnique({ where: { id } });
}

export async function getBudgetItemsBySectionIdController(sectionId: string) {
  return prisma.budgetItem.findMany({
    where: { sectionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBudgetItemController(id: string, input: UpdateBudgetItemInput) {
  const data = updateBudgetItemSchema.parse(input);

  return prisma.budgetItem.update({
    where: { id },
    data,
  });
}

export async function deleteBudgetItemController(id: string) {
  return prisma.budgetItem.delete({ where: { id } });
}