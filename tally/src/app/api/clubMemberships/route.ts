import { NextResponse } from "next/server";
import {
  postClubMembershipController,
  getAllClubMembershipsController,
  getOneClubMembershipController,
  getClubMembershipsByUserIdController,
  getClubMembershipsByClubIdController,
  updateClubMembershipController,
  deleteClubMembershipController,
  getTreasurerClubMembersController,
} from "./controller";

/**
 * POST /api/club-memberships
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const membership = await postClubMembershipController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Membership created", data: membership },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/club-memberships error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create membership" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/club-memberships
 * Supports:
 *  - ?id=
 *  - ?userId=
 *  - ?clubId=
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const clubId = searchParams.get("clubId");

    const treasurerUserId = searchParams.get("treasurerUserId");

    if (id) {
      const membership = await getOneClubMembershipController(id);
      if (!membership) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: `Membership ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: membership });
    }

    if (treasurerUserId) {
      const data = await getTreasurerClubMembersController(treasurerUserId);

      if (!data) {
        return NextResponse.json(
          { code: "FORBIDDEN", message: "User is not a treasurer of any club" },
          { status: 403 }
        );
      }

      return NextResponse.json({ code: "SUCCESS", data });
    }


    if (userId) {
      const memberships = await getClubMembershipsByUserIdController(userId);
      return NextResponse.json({ code: "SUCCESS", data: memberships });
    }

    if (clubId) {
      const memberships = await getClubMembershipsByClubIdController(clubId);
      return NextResponse.json({ code: "SUCCESS", data: memberships });
    }

    const memberships = await getAllClubMembershipsController();
    return NextResponse.json({ code: "SUCCESS", data: memberships });
  } catch (error) {
    console.error("GET /api/club-memberships error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch memberships" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/club-memberships?id=<membershipId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateClubMembershipController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/club-memberships error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update membership" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/club-memberships?id=<membershipId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteClubMembershipController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/club-memberships error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete membership" },
      { status: 500 }
    );
  }
}

