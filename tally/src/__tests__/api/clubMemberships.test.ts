import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  postClubMembershipController,
  getAllClubMembershipsController,
  getOneClubMembershipController,
  getClubMembershipsByUserIdController,
  getClubMembershipsByClubIdController,
  updateClubMembershipController,
  deleteClubMembershipController,
  getTreasurerClubMembersController,
} from "@/app/api/clubMemberships/controller";

const fakeMembership = {
  id: "mem-1",
  clubId: "club-1",
  userId: "user-clerk-1",
  role: "MEMBER" as const,
  createdAt: new Date(),
};

const fakeUser = {
  id: "user-clerk-1",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  role: "STANDARD" as const,
  studentId: null,
  phoneNumber: null,
  permAddress1: null,
  permCity: null,
  permState: null,
  permZip: null,
  tempAddress1: null,
  tempCity: null,
  tempState: null,
  tempZip: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("postClubMembershipController", () => {
  it("creates a membership with MEMBER as default role", async () => {
    prismaMock.clubMembership.create.mockResolvedValue(fakeMembership);
    const result = await postClubMembershipController({ clubId: "club-1", userId: "user-clerk-1" });
    expect(result).toEqual(fakeMembership);
    expect(prismaMock.clubMembership.create).toHaveBeenCalledWith({
      data: { clubId: "club-1", userId: "user-clerk-1", role: "MEMBER" },
    });
  });

  it("respects explicit TREASURER role", async () => {
    const treasurer = { ...fakeMembership, role: "TREASURER" as const };
    prismaMock.clubMembership.create.mockResolvedValue(treasurer);
    await postClubMembershipController({ clubId: "club-1", userId: "user-clerk-1", role: "TREASURER" });
    expect(prismaMock.clubMembership.create).toHaveBeenCalledWith({
      data: { clubId: "club-1", userId: "user-clerk-1", role: "TREASURER" },
    });
  });

  it("throws on empty clubId", async () => {
    await expect(
      postClubMembershipController({ clubId: "", userId: "user-1" })
    ).rejects.toThrow();
  });
});

describe("getAllClubMembershipsController", () => {
  it("returns all memberships", async () => {
    prismaMock.clubMembership.findMany.mockResolvedValue([fakeMembership]);
    expect(await getAllClubMembershipsController()).toEqual([fakeMembership]);
  });
});

describe("getOneClubMembershipController", () => {
  it("returns membership by id", async () => {
    prismaMock.clubMembership.findUnique.mockResolvedValue(fakeMembership);
    expect(await getOneClubMembershipController("mem-1")).toEqual(fakeMembership);
  });

  it("returns null when not found", async () => {
    prismaMock.clubMembership.findUnique.mockResolvedValue(null);
    expect(await getOneClubMembershipController("missing")).toBeNull();
  });
});

describe("getClubMembershipsByUserIdController", () => {
  it("returns memberships for a user", async () => {
    prismaMock.clubMembership.findMany.mockResolvedValue([fakeMembership]);
    await getClubMembershipsByUserIdController("user-clerk-1");
    expect(prismaMock.clubMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "user-clerk-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getClubMembershipsByClubIdController", () => {
  it("returns memberships with users for a club", async () => {
    const withUser = { ...fakeMembership, user: fakeUser };
    prismaMock.clubMembership.findMany.mockResolvedValue([withUser] as never);
    await getClubMembershipsByClubIdController("club-1");
    expect(prismaMock.clubMembership.findMany).toHaveBeenCalledWith({
      where: { clubId: "club-1" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("updateClubMembershipController", () => {
  it("updates role", async () => {
    const updated = { ...fakeMembership, role: "TREASURER" as const };
    prismaMock.clubMembership.update.mockResolvedValue(updated);
    const result = await updateClubMembershipController("mem-1", { role: "TREASURER" });
    expect(result.role).toBe("TREASURER");
  });
});

describe("deleteClubMembershipController", () => {
  it("deletes a membership", async () => {
    prismaMock.clubMembership.delete.mockResolvedValue(fakeMembership);
    await deleteClubMembershipController("mem-1");
    expect(prismaMock.clubMembership.delete).toHaveBeenCalledWith({ where: { id: "mem-1" } });
  });
});

describe("getTreasurerClubMembersController", () => {
  it("returns null when user is not a treasurer", async () => {
    prismaMock.clubMembership.findFirst.mockResolvedValue(null);
    const result = await getTreasurerClubMembersController("non-treasurer");
    expect(result).toBeNull();
  });

  it("returns club members when user is a treasurer", async () => {
    prismaMock.clubMembership.findFirst.mockResolvedValue({ clubId: "club-1" } as never);
    const membersWithUsers = [{ ...fakeMembership, user: fakeUser }];
    prismaMock.clubMembership.findMany.mockResolvedValue(membersWithUsers as never);

    const result = await getTreasurerClubMembersController("user-clerk-1");
    expect(result).not.toBeNull();
    expect(result!.clubId).toBe("club-1");
    expect(result!.members[0].fullName).toBe("Jane Doe");
  });
});
