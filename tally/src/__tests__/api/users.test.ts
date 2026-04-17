import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  postUserController,
  getAllUsersController,
  getOneUserController,
  getUserByClerkIdController,
  getUserByEmailController,
  getUsersByRoleController,
  updateUserController,
  deleteUserController,
} from "@/app/api/users/controller";

const fakeUser = {
  id: "clerk-user-1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
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

describe("postUserController", () => {
  it("creates a user with STANDARD as default role", async () => {
    prismaMock.user.create.mockResolvedValue(fakeUser);
    const result = await postUserController({ id: "clerk-user-1", email: "jane@example.com" });
    expect(result).toEqual(fakeUser);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "clerk-user-1", role: "STANDARD" }),
    });
  });

  it("normalizes email to lowercase", async () => {
    prismaMock.user.create.mockResolvedValue(fakeUser);
    await postUserController({ id: "clerk-user-1", email: "Jane@Example.COM" });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "jane@example.com" }),
    });
  });

  it("throws on invalid email", async () => {
    await expect(postUserController({ id: "clerk-1", email: "not-an-email" })).rejects.toThrow();
  });

  it("throws on empty id", async () => {
    await expect(postUserController({ id: "", email: "a@b.com" })).rejects.toThrow();
  });
});

describe("getAllUsersController", () => {
  it("returns all users ordered by createdAt desc", async () => {
    prismaMock.user.findMany.mockResolvedValue([fakeUser]);
    const result = await getAllUsersController();
    expect(result).toEqual([fakeUser]);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });
});

describe("getOneUserController", () => {
  it("returns user by id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    expect(await getOneUserController("clerk-user-1")).toEqual(fakeUser);
  });

  it("returns null when not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await getOneUserController("missing")).toBeNull();
  });
});

describe("getUserByClerkIdController", () => {
  it("looks up user by Clerk ID", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    await getUserByClerkIdController("clerk-user-1");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "clerk-user-1" } });
  });
});

describe("getUserByEmailController", () => {
  it("lowercases email before lookup", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeUser);
    await getUserByEmailController("Jane@Example.COM");
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
    });
  });
});

describe("getUsersByRoleController", () => {
  it("returns users filtered by role", async () => {
    prismaMock.user.findMany.mockResolvedValue([fakeUser]);
    await getUsersByRoleController("STANDARD");
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: { role: "STANDARD" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("updateUserController", () => {
  it("updates user fields", async () => {
    const updated = { ...fakeUser, firstName: "John" };
    prismaMock.user.update.mockResolvedValue(updated);
    const result = await updateUserController("clerk-user-1", { firstName: "John" });
    expect(result.firstName).toBe("John");
  });

  it("lowercases email on update", async () => {
    prismaMock.user.update.mockResolvedValue(fakeUser);
    await updateUserController("clerk-user-1", { email: "NEW@EMAIL.COM" });
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "new@email.com" }) })
    );
  });
});

describe("deleteUserController", () => {
  it("deletes user by id", async () => {
    prismaMock.user.delete.mockResolvedValue(fakeUser);
    await deleteUserController("clerk-user-1");
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "clerk-user-1" } });
  });
});
