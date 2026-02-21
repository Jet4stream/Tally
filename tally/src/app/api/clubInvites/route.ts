import { NextResponse } from "next/server";
import {
  postClubInviteController,
  getAllClubInvitesController,
  getOneClubInviteController,
  getClubInvitesByClubIdController,
  getClubInvitesByEmailController,
  updateClubInviteController,
  deleteClubInviteController,
} from "./controller";

/**
 * POST /api/club-invitations
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invite = await postClubInviteController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Invitation created", data: invite },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/club-invitations error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/club-invitations
 * Supports:
 *  - ?id=
 *  - ?clubId=
 *  - ?userEmail=
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clubId = searchParams.get("clubId");
    const userEmail = searchParams.get("userEmail");

    if (id) {
      const invite = await getOneClubInviteController(id);
      if (!invite) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: `Invitation ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: invite });
    }

    if (clubId) {
      const invites = await getClubInvitesByClubIdController(clubId);
      return NextResponse.json({ code: "SUCCESS", data: invites });
    }

    if (userEmail) {
      const invites = await getClubInvitesByEmailController(userEmail);
      return NextResponse.json({ code: "SUCCESS", data: invites });
    }

    const invites = await getAllClubInvitesController();
    return NextResponse.json({ code: "SUCCESS", data: invites });
  } catch (error) {
    console.error("GET /api/club-invitations error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/club-invitations?id=<invitationId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateClubInviteController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/club-invitations error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update invitation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/club-invitations?id=<invitationId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteClubInviteController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/club-invitations error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete invitation" },
      { status: 500 }
    );
  }
}