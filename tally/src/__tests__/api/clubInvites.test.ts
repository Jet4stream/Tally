import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../mocks/prisma";

// Mock nodemailer before importing the controller (which calls createTransport at module level)
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
    }),
  },
}));

import {
  postClubInviteController,
  getAllClubInvitesController,
  getOneClubInviteController,
  getClubInvitesByClubIdController,
  getClubInvitesByEmailController,
  updateClubInviteController,
  deleteClubInviteController,
  deleteClubInvitesByEmailAndClubIdController,
} from "@/app/api/clubInvites/controller";

const fakeInvite = {
  id: "invite-1",
  clubId: "club-1",
  userEmail: "user@example.com",
  role: "MEMBER" as const,
  expiresAt: new Date("2030-01-01"),
  createdAt: new Date(),
};

describe("postClubInviteController", () => {
  it("creates an invite and sends email", async () => {
    prismaMock.clubInvite.create.mockResolvedValue(fakeInvite);
    const result = await postClubInviteController({
      clubId: "club-1",
      userEmail: "user@example.com",
      expiresAt: new Date("2030-01-01"),
    });
    expect(result).toEqual(fakeInvite);
    expect(prismaMock.clubInvite.create).toHaveBeenCalled();
  });

  it("normalizes email to lowercase", async () => {
    prismaMock.clubInvite.create.mockResolvedValue(fakeInvite);
    await postClubInviteController({
      clubId: "club-1",
      userEmail: "User@Example.COM",
      expiresAt: new Date("2030-01-01"),
    });
    expect(prismaMock.clubInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userEmail: "user@example.com" }),
      })
    );
  });

  it("throws on invalid email", async () => {
    await expect(
      postClubInviteController({ clubId: "club-1", userEmail: "not-an-email", expiresAt: new Date() })
    ).rejects.toThrow();
  });

  it("throws on empty clubId", async () => {
    await expect(
      postClubInviteController({ clubId: "", userEmail: "a@b.com", expiresAt: new Date() })
    ).rejects.toThrow();
  });
});

describe("getAllClubInvitesController", () => {
  it("returns all invites", async () => {
    prismaMock.clubInvite.findMany.mockResolvedValue([fakeInvite]);
    expect(await getAllClubInvitesController()).toEqual([fakeInvite]);
  });
});

describe("getOneClubInviteController", () => {
  it("returns invite by id", async () => {
    prismaMock.clubInvite.findUnique.mockResolvedValue(fakeInvite);
    expect(await getOneClubInviteController("invite-1")).toEqual(fakeInvite);
  });

  it("returns null when not found", async () => {
    prismaMock.clubInvite.findUnique.mockResolvedValue(null);
    expect(await getOneClubInviteController("missing")).toBeNull();
  });
});

describe("getClubInvitesByClubIdController", () => {
  it("returns invites for a club", async () => {
    prismaMock.clubInvite.findMany.mockResolvedValue([fakeInvite]);
    await getClubInvitesByClubIdController("club-1");
    expect(prismaMock.clubInvite.findMany).toHaveBeenCalledWith({
      where: { clubId: "club-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getClubInvitesByEmailController", () => {
  it("lowercases email in lookup", async () => {
    prismaMock.clubInvite.findMany.mockResolvedValue([fakeInvite]);
    await getClubInvitesByEmailController("User@Example.COM");
    expect(prismaMock.clubInvite.findMany).toHaveBeenCalledWith({
      where: { userEmail: "user@example.com" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("updateClubInviteController", () => {
  it("updates expiry", async () => {
    const newExpiry = new Date("2031-01-01");
    prismaMock.clubInvite.update.mockResolvedValue({ ...fakeInvite, expiresAt: newExpiry });
    const result = await updateClubInviteController("invite-1", { expiresAt: newExpiry });
    expect(result.expiresAt).toEqual(newExpiry);
  });
});

describe("deleteClubInviteController", () => {
  it("deletes an invite", async () => {
    prismaMock.clubInvite.delete.mockResolvedValue(fakeInvite);
    await deleteClubInviteController("invite-1");
    expect(prismaMock.clubInvite.delete).toHaveBeenCalledWith({ where: { id: "invite-1" } });
  });
});

describe("deleteClubInvitesByEmailAndClubIdController", () => {
  it("bulk-deletes invites and returns count", async () => {
    prismaMock.clubInvite.deleteMany.mockResolvedValue({ count: 3 });
    const result = await deleteClubInvitesByEmailAndClubIdController("User@Example.COM", "club-1");
    expect(result).toEqual({ deletedCount: 3 });
    expect(prismaMock.clubInvite.deleteMany).toHaveBeenCalledWith({
      where: { userEmail: "user@example.com", clubId: "club-1" },
    });
  });
});
