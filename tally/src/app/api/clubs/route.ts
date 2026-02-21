import { NextResponse } from "next/server";
import {
  postClubController,
  getAllClubsController,
  getOneClubController,
  getClubsByNameController,
  updateClubController,
  deleteClubController,
} from "./controller";

/**
 * POST /api/clubs
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const club = await postClubController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Club created", data: club },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/clubs error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create club" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/clubs
 * Supports:
 *  - ?id=
 *  - ?name= (contains, case-insensitive)
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    if (id) {
      const club = await getOneClubController(id);
      if (!club) {
        return NextResponse.json(
          { code: "CLUB_NOT_FOUND", message: `Club with id ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: club });
    }

    if (name) {
      const clubs = await getClubsByNameController(name);
      return NextResponse.json({ code: "SUCCESS", data: clubs });
    }

    const clubs = await getAllClubsController();
    return NextResponse.json({ code: "SUCCESS", data: clubs });
  } catch (error) {
    console.error("GET /api/clubs error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clubs?id=<clubId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateClubController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/clubs error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update club" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clubs?id=<clubId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteClubController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/clubs error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete club" },
      { status: 500 }
    );
  }
}