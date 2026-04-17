import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";

const mockRemove = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn().mockReturnValue({ remove: mockRemove }),
    },
  },
}));

import {
  postReimbursementController,
  getAllReimbursementsController,
  getOneReimbursementController,
  getReimbursementsByPayeeUserIdController,
  getReimbursementsByClubIdController,
  updateReimbursementController,
  deleteReimbursementWithFilesController,
} from "@/app/api/reimbursements/controller";

const CLUB_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const fakeReimbursement = {
  id: "reimb-1",
  clubId: CLUB_ID,
  clubName: "Robotics",
  createdUserId: "user-1",
  payeeUserId: "user-2",
  budgetItemId: null,
  amountCents: 2500,
  description: "Supplies",
  status: "SUBMITTED" as const,
  rejectionReason: null,
  submittedAt: new Date(),
  receiptFileUrl: null,
  generatedFormPdfUrl: null,
  packetPdfUrl: null,
  reviewedAt: null,
  paidAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("postReimbursementController", () => {
  it("creates a reimbursement with SUBMITTED default status", async () => {
    prismaMock.reimbursement.create.mockResolvedValue(fakeReimbursement);
    const result = await postReimbursementController({
      clubId: CLUB_ID,
      clubName: "Robotics",
      createdUserId: "user-1",
      payeeUserId: "user-2",
      amountCents: 2500,
      description: "Supplies",
    });
    expect(result).toEqual(fakeReimbursement);
    expect(prismaMock.reimbursement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "SUBMITTED" }),
    });
  });

  it("throws on non-positive amountCents", async () => {
    await expect(
      postReimbursementController({
        clubId: CLUB_ID,
        clubName: "Club",
        createdUserId: "u1",
        payeeUserId: "u2",
        amountCents: 0,
        description: "Test",
      })
    ).rejects.toThrow();
  });

  it("throws on invalid clubId uuid", async () => {
    await expect(
      postReimbursementController({
        clubId: "not-a-uuid",
        clubName: "Club",
        createdUserId: "u1",
        payeeUserId: "u2",
        amountCents: 100,
        description: "Test",
      })
    ).rejects.toThrow();
  });
});

describe("getAllReimbursementsController", () => {
  it("returns all reimbursements with payee", async () => {
    prismaMock.reimbursement.findMany.mockResolvedValue([fakeReimbursement] as never);
    const result = await getAllReimbursementsController();
    expect(result).toEqual([fakeReimbursement]);
    expect(prismaMock.reimbursement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.objectContaining({ payee: expect.anything() }) })
    );
  });
});

describe("getOneReimbursementController", () => {
  it("returns reimbursement by id", async () => {
    prismaMock.reimbursement.findUnique.mockResolvedValue(fakeReimbursement);
    expect(await getOneReimbursementController("reimb-1")).toEqual(fakeReimbursement);
  });

  it("returns null when not found", async () => {
    prismaMock.reimbursement.findUnique.mockResolvedValue(null);
    expect(await getOneReimbursementController("missing")).toBeNull();
  });
});

describe("getReimbursementsByPayeeUserIdController", () => {
  it("fetches by payeeUserId", async () => {
    prismaMock.reimbursement.findMany.mockResolvedValue([fakeReimbursement] as never);
    await getReimbursementsByPayeeUserIdController("user-2");
    expect(prismaMock.reimbursement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { payeeUserId: "user-2" } })
    );
  });
});

describe("getReimbursementsByClubIdController", () => {
  it("fetches by clubId", async () => {
    prismaMock.reimbursement.findMany.mockResolvedValue([fakeReimbursement] as never);
    await getReimbursementsByClubIdController(CLUB_ID);
    expect(prismaMock.reimbursement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clubId: CLUB_ID } })
    );
  });
});

describe("updateReimbursementController", () => {
  it("updates status", async () => {
    const updated = { ...fakeReimbursement, status: "APPROVED" as const };
    prismaMock.reimbursement.update.mockResolvedValue(updated);
    const result = await updateReimbursementController("reimb-1", { status: "APPROVED" });
    expect(result.status).toBe("APPROVED");
  });
});

describe("deleteReimbursementWithFilesController", () => {
  it("throws when reimbursement not found", async () => {
    prismaMock.reimbursement.findUnique.mockResolvedValue(null);
    await expect(deleteReimbursementWithFilesController("missing")).rejects.toThrow("Reimbursement not found");
  });

  it("deletes without calling supabase when no files", async () => {
    prismaMock.reimbursement.findUnique.mockResolvedValue(fakeReimbursement);
    prismaMock.reimbursement.delete.mockResolvedValue(fakeReimbursement);
    mockRemove.mockClear();

    const result = await deleteReimbursementWithFilesController("reimb-1");
    expect(result).toEqual({ success: true });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("deletes supabase files before DB record", async () => {
    const withFiles = {
      ...fakeReimbursement,
      receiptFileUrl: "supabase://reimbursements/receipt/club-1/uuid/file.jpg",
    };
    prismaMock.reimbursement.findUnique.mockResolvedValue(withFiles);
    prismaMock.reimbursement.delete.mockResolvedValue(withFiles);
    mockRemove.mockResolvedValue({ error: null });

    await deleteReimbursementWithFilesController("reimb-1");
    expect(mockRemove).toHaveBeenCalledWith(["receipt/club-1/uuid/file.jpg"]);
    expect(prismaMock.reimbursement.delete).toHaveBeenCalled();
  });

  it("throws when supabase deletion fails", async () => {
    const withFiles = {
      ...fakeReimbursement,
      receiptFileUrl: "supabase://reimbursements/receipt/club-1/uuid/file.jpg",
    };
    prismaMock.reimbursement.findUnique.mockResolvedValue(withFiles);
    mockRemove.mockResolvedValue({ error: new Error("storage error") });

    await expect(deleteReimbursementWithFilesController("reimb-1")).rejects.toThrow(
      "Failed to delete reimbursement files"
    );
  });
});
