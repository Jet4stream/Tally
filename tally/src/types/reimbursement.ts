import { Prisma } from "@prisma/client";

export type ReimbursementWithPayee =
  Prisma.ReimbursementGetPayload<{ include: { payee: true } }>;