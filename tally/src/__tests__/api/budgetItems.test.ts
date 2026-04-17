import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  postBudgetItemController,
  getAllBudgetItemsController,
  getOneBudgetItemController,
  getBudgetItemsBySectionIdController,
  updateBudgetItemController,
  deleteBudgetItemController,
} from "@/app/api/budgetItems/controller";

const SECTION_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

const fakeItem = {
  id: "item-1",
  sectionId: SECTION_ID,
  label: "Food supplies",
  category: "FOOD" as const,
  allocatedCents: 5000,
  spentCents: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("postBudgetItemController", () => {
  it("creates a budget item", async () => {
    prismaMock.budgetItem.create.mockResolvedValue(fakeItem);
    const result = await postBudgetItemController({
      sectionId: SECTION_ID,
      label: "Food supplies",
      category: "FOOD",
      allocatedCents: 5000,
    });
    expect(result).toEqual(fakeItem);
    expect(prismaMock.budgetItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ label: "Food supplies", allocatedCents: 5000 }),
    });
  });

  it("defaults spentCents to 0", async () => {
    prismaMock.budgetItem.create.mockResolvedValue(fakeItem);
    await postBudgetItemController({
      sectionId: SECTION_ID,
      label: "Supplies",
      category: "NONFOOD",
      allocatedCents: 1000,
    });
    expect(prismaMock.budgetItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ spentCents: 0 }),
    });
  });

  it("throws on invalid sectionId uuid", async () => {
    await expect(
      postBudgetItemController({ sectionId: "bad", label: "X", category: "FOOD", allocatedCents: 0 })
    ).rejects.toThrow();
  });

  it("throws on negative allocatedCents", async () => {
    await expect(
      postBudgetItemController({ sectionId: SECTION_ID, label: "X", category: "FOOD", allocatedCents: -1 })
    ).rejects.toThrow();
  });

  it("throws on invalid category", async () => {
    await expect(
      postBudgetItemController({ sectionId: SECTION_ID, label: "X", category: "INVALID" as never, allocatedCents: 0 })
    ).rejects.toThrow();
  });
});

describe("getAllBudgetItemsController", () => {
  it("returns all items", async () => {
    prismaMock.budgetItem.findMany.mockResolvedValue([fakeItem]);
    expect(await getAllBudgetItemsController()).toEqual([fakeItem]);
  });
});

describe("getOneBudgetItemController", () => {
  it("returns item by id", async () => {
    prismaMock.budgetItem.findUnique.mockResolvedValue(fakeItem);
    expect(await getOneBudgetItemController("item-1")).toEqual(fakeItem);
  });

  it("returns null when not found", async () => {
    prismaMock.budgetItem.findUnique.mockResolvedValue(null);
    expect(await getOneBudgetItemController("missing")).toBeNull();
  });
});

describe("getBudgetItemsBySectionIdController", () => {
  it("returns items for a section", async () => {
    prismaMock.budgetItem.findMany.mockResolvedValue([fakeItem]);
    const result = await getBudgetItemsBySectionIdController(SECTION_ID);
    expect(prismaMock.budgetItem.findMany).toHaveBeenCalledWith({
      where: { sectionId: SECTION_ID },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual([fakeItem]);
  });
});

describe("updateBudgetItemController", () => {
  it("updates label and amount", async () => {
    const updated = { ...fakeItem, label: "Drinks", allocatedCents: 2000 };
    prismaMock.budgetItem.update.mockResolvedValue(updated);
    const result = await updateBudgetItemController("item-1", { label: "Drinks", allocatedCents: 2000 });
    expect(result.label).toBe("Drinks");
  });
});

describe("deleteBudgetItemController", () => {
  it("deletes an item", async () => {
    prismaMock.budgetItem.delete.mockResolvedValue(fakeItem);
    await deleteBudgetItemController("item-1");
    expect(prismaMock.budgetItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
  });
});
