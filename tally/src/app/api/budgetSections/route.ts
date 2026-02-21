import { NextResponse } from "next/server";
import {
  postBudgetSectionController,
  getAllBudgetSectionsController,
  getOneBudgetSectionController,
  getBudgetSectionsByClubIdController,
  updateBudgetSectionController,
  deleteBudgetSectionController,
} from "./controller";

/**
 * POST /api/budget-sections
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const section = await postBudgetSectionController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Budget section created", data: section },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/budget-sections error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create budget section" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/budget-sections
 * Supports:
 *  - ?id=
 *  - ?clubId=
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clubId = searchParams.get("clubId");

    if (id) {
      const section = await getOneBudgetSectionController(id);
      if (!section) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: `Budget section ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: section });
    }

    if (clubId) {
      const sections = await getBudgetSectionsByClubIdController(clubId);
      return NextResponse.json({ code: "SUCCESS", data: sections });
    }

    const sections = await getAllBudgetSectionsController();
    return NextResponse.json({ code: "SUCCESS", data: sections });
  } catch (error) {
    console.error("GET /api/budget-sections error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch budget sections" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/budget-sections?id=<sectionId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateBudgetSectionController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/budget-sections error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update budget section" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budget-sections?id=<sectionId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteBudgetSectionController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/budget-sections error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete budget section" },
      { status: 500 }
    );
  }
}