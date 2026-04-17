import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  postClubController,
  getAllClubsController,
  getOneClubController,
  getClubsByNameController,
  updateClubController,
  deleteClubController,
} from "@/app/api/clubs/controller";

const fakeClub = {
  id: "club-1",
  name: "Robotics Club",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("postClubController", () => {
  it("creates a club with valid input", async () => {
    prismaMock.club.create.mockResolvedValue(fakeClub);
    const result = await postClubController({ name: "Robotics Club" });
    expect(result).toEqual(fakeClub);
    expect(prismaMock.club.create).toHaveBeenCalledWith({
      data: { name: "Robotics Club" },
    });
  });

  it("trims whitespace from name", async () => {
    prismaMock.club.create.mockResolvedValue(fakeClub);
    await postClubController({ name: "  Robotics Club  " });
    expect(prismaMock.club.create).toHaveBeenCalledWith({
      data: { name: "Robotics Club" },
    });
  });

  it("throws on empty name", async () => {
    await expect(postClubController({ name: "" })).rejects.toThrow();
  });
});

describe("getAllClubsController", () => {
  it("returns all clubs ordered by createdAt desc", async () => {
    prismaMock.club.findMany.mockResolvedValue([fakeClub]);
    const result = await getAllClubsController();
    expect(result).toEqual([fakeClub]);
    expect(prismaMock.club.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getOneClubController", () => {
  it("returns a club by id", async () => {
    prismaMock.club.findUnique.mockResolvedValue(fakeClub);
    const result = await getOneClubController("club-1");
    expect(result).toEqual(fakeClub);
  });

  it("returns null when not found", async () => {
    prismaMock.club.findUnique.mockResolvedValue(null);
    const result = await getOneClubController("missing");
    expect(result).toBeNull();
  });
});

describe("getClubsByNameController", () => {
  it("searches clubs by name case-insensitively", async () => {
    prismaMock.club.findMany.mockResolvedValue([fakeClub]);
    const result = await getClubsByNameController("robot");
    expect(result).toEqual([fakeClub]);
    expect(prismaMock.club.findMany).toHaveBeenCalledWith({
      where: { name: { contains: "robot", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("updateClubController", () => {
  it("updates a club", async () => {
    const updated = { ...fakeClub, name: "Chess Club" };
    prismaMock.club.update.mockResolvedValue(updated);
    const result = await updateClubController("club-1", { name: "Chess Club" });
    expect(result.name).toBe("Chess Club");
  });
});

describe("deleteClubController", () => {
  it("deletes a club by id", async () => {
    prismaMock.club.delete.mockResolvedValue(fakeClub);
    const result = await deleteClubController("club-1");
    expect(result).toEqual(fakeClub);
    expect(prismaMock.club.delete).toHaveBeenCalledWith({ where: { id: "club-1" } });
  });
});
