import { NextResponse } from "next/server";
import { GlobalRole } from "@prisma/client";
import {
  postUserController,
  getAllUsersController,
  getOneUserController,
  getUserByClerkIdController,
  getUserByEmailController,
  getUsersByRoleController,
  updateUserController,
  deleteUserController,
} from "./controller";

/**
 * POST /api/users
 * Body: Create user
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await postUserController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "User created", data: user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users
 * Supports:
 *  - ?id=
 *  - ?clerkId=
 *  - ?email=
 *  - ?role=TCU_TREASURER|STANDARD
 *  - none -> all users
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const clerkId = searchParams.get("clerkId");
    const email = searchParams.get("email");
    const role = searchParams.get("role") as GlobalRole | null;

    if (clerkId) {
      const user = await getUserByClerkIdController(clerkId);
      if (!user) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: `User with Clerk ID ${clerkId} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: user });
    }

    if (id) {
      const user = await getOneUserController(id);
      if (!user) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: `User with Id ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: user });
    }

    if (email) {
      const user = await getUserByEmailController(email);
      if (!user) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND", message: `User with email ${email} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: user });
    }

    if (role) {
      const users = await getUsersByRoleController(role);
      return NextResponse.json({ code: "SUCCESS", data: users });
    }

    const users = await getAllUsersController();
    return NextResponse.json({ code: "SUCCESS", data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users?id=<clerkId>
 * Body: partial update
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updatedUser = await updateUserController(id, updateData);

    return NextResponse.json({ code: "SUCCESS", data: updatedUser });
  } catch (error: any) {
    console.error("PUT /api/users error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users?id=<clerkId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deletedUser = await deleteUserController(id);
    return NextResponse.json({ code: "SUCCESS", data: deletedUser });
  } catch (error: any) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete user" },
      { status: 500 }
    );
  }
}