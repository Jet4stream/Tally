import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  postBudgetSectionController,
  getAllBudgetSectionsController,
  getOneBudgetSectionController,
  getBudgetSectionsByClubIdController,
  updateBudgetSectionController,
  deleteBudgetSectionController,
} from "@/app/api/budgetSections/controller";

const CLUB_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const fakeSection = {
  id: "sec-1",
  clubId: CLUB_ID,
  title: "Operations",
  definition: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("postBudgetSectionController", () => {
  it("creates a section with valid input", async () => {
    prismaMock.budgetSection.create.mockResolvedValue(fakeSection);
    const result = await postBudgetSectionController({ clubId: CLUB_ID, title: "Operations" });
    expect(result).toEqual(fakeSection);
    expect(prismaMock.budgetSection.create).toHaveBeenCalledWith({
      data: { clubId: CLUB_ID, title: "Operations", definition: null },
    });
  });

  it("throws on invalid uuid for clubId", async () => {
    await expect(
      postBudgetSectionController({ clubId: "not-a-uuid", title: "Ops" })
    ).rejects.toThrow();
  });

  it("throws on empty title", async () => {
    await expect(
      postBudgetSectionController({ clubId: CLUB_ID, title: "" })
    ).rejects.toThrow();
  });
});

describe("getAllBudgetSectionsController", () => {
  it("returns all sections", async () => {
    prismaMock.budgetSection.findMany.mockResolvedValue([fakeSection]);
    const result = await getAllBudgetSectionsController();
    expect(result).toEqual([fakeSection]);
  });
});

describe("getOneBudgetSectionController", () => {
  it("returns section by id", async () => {
    prismaMock.budgetSection.findUnique.mockResolvedValue(fakeSection);
    expect(await getOneBudgetSectionController("sec-1")).toEqual(fakeSection);
  });

  it("returns null when not found", async () => {
    prismaMock.budgetSection.findUnique.mockResolvedValue(null);
    expect(await getOneBudgetSectionController("missing")).toBeNull();
  });
});

describe("getBudgetSectionsByClubIdController", () => {
  it("returns sections for a club", async () => {
    prismaMock.budgetSection.findMany.mockResolvedValue([fakeSection]);
    const result = await getBudgetSectionsByClubIdController(CLUB_ID);
    expect(result).toEqual([fakeSection]);
    expect(prismaMock.budgetSection.findMany).toHaveBeenCalledWith({
      where: { clubId: CLUB_ID },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("updateBudgetSectionController", () => {
  it("updates title", async () => {
    const updated = { ...fakeSection, title: "Finance" };
    prismaMock.budgetSection.update.mockResolvedValue(updated);
    const result = await updateBudgetSectionController("sec-1", { title: "Finance" });
    expect(result.title).toBe("Finance");
  });
});

describe("deleteBudgetSectionController", () => {
  it("deletes a section", async () => {
    prismaMock.budgetSection.delete.mockResolvedValue(fakeSection);
    const result = await deleteBudgetSectionController("sec-1");
    expect(prismaMock.budgetSection.delete).toHaveBeenCalledWith({ where: { id: "sec-1" } });
    expect(result).toEqual(fakeSection);
  });
});
