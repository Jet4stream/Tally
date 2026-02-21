import { NextResponse } from "next/server";
import {
  postReimbursementController,
  getAllReimbursementsController,
  getOneReimbursementController,
  getReimbursementsByPayeeUserIdController,
  getReimbursementsByClubIdController,
  updateReimbursementController,
  deleteReimbursementController,
} from "./controller";

/**
 * POST /api/reimbursements
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await postReimbursementController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Reimbursement created", data: r },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/reimbursements error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create reimbursement" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reimbursements
 * Supports:
 *  - ?id=
 *  - ?payeeUserId=
 *  - ?clubId=
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const payeeUserId = searchParams.get("payeeUserId");
    const clubId = searchParams.get("clubId");

    if (id) {
      const r = await getOneReimbursementController(id);
      if (!r) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: `Reimbursement ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: r });
    }

    if (payeeUserId) {
      const rs = await getReimbursementsByPayeeUserIdController(payeeUserId);
      return NextResponse.json({ code: "SUCCESS", data: rs });
    }

    if (clubId) {
      const rs = await getReimbursementsByClubIdController(clubId);
      return NextResponse.json({ code: "SUCCESS", data: rs });
    }

    const rs = await getAllReimbursementsController();
    return NextResponse.json({ code: "SUCCESS", data: rs });
  } catch (error) {
    console.error("GET /api/reimbursements error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch reimbursements" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reimbursements?id=<reimbursementId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateReimbursementController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/reimbursements error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update reimbursement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reimbursements?id=<reimbursementId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteReimbursementController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/reimbursements error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete reimbursement" },
      { status: 500 }
    );
  }
}