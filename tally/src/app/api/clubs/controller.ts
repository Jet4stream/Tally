import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const createClubSchema = z.object({
  name: z.string().min(1).trim(),
});

export const updateClubSchema = createClubSchema.partial();

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;

export async function postClubController(input: CreateClubInput) {
  const data = createClubSchema.parse(input);

  return prisma.club.create({
    data: { name: data.name },
  });
}

export async function getAllClubsController() {
  return prisma.club.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getOneClubController(id: string) {
  return prisma.club.findUnique({ where: { id } });
}

export async function getClubsByNameController(name: string) {
  return prisma.club.findMany({
    where: { name: { contains: name, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateClubController(id: string, input: UpdateClubInput) {
  const data = updateClubSchema.parse(input);

  return prisma.club.update({
    where: { id },
    data,
  });
}

export async function deleteClubController(id: string) {
  return prisma.club.delete({ where: { id } });
}