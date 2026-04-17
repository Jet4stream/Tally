import { vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "./mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  resetPrismaMock();
});
