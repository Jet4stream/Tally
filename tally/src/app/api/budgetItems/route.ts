import { NextResponse } from "next/server";
import {
  postBudgetItemController,
  getAllBudgetItemsController,
  getOneBudgetItemController,
  getBudgetItemsBySectionIdController,
  updateBudgetItemController,
  deleteBudgetItemController,
} from "./controller";

/**
 * POST /api/budget-items
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await postBudgetItemController(body);

    return NextResponse.json(
      { code: "SUCCESS", message: "Budget item created", data: item },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/budget-items error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create budget item" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/budget-items
 * Supports:
 *  - ?id=
 *  - ?sectionId=
 *  - none -> all
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sectionId = searchParams.get("sectionId");

    if (id) {
      const item = await getOneBudgetItemController(id);
      if (!item) {
        return NextResponse.json(
          { code: "NOT_FOUND", message: `Budget item ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ code: "SUCCESS", data: item });
    }

    if (sectionId) {
      const items = await getBudgetItemsBySectionIdController(sectionId);
      return NextResponse.json({ code: "SUCCESS", data: items });
    }

    const items = await getAllBudgetItemsController();
    return NextResponse.json({ code: "SUCCESS", data: items });
  } catch (error) {
    console.error("GET /api/budget-items error:", error);
    return NextResponse.json(
      { code: "ERROR", message: "Failed to fetch budget items" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/budget-items?id=<budgetItemId>
 */
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const updateData = await req.json();
    const updated = await updateBudgetItemController(id, updateData);
    return NextResponse.json({ code: "SUCCESS", data: updated });
  } catch (error: any) {
    console.error("PUT /api/budget-items error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to update budget item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budget-items?id=<budgetItemId>
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: "ERROR", message: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteBudgetItemController(id);
    return NextResponse.json({ code: "SUCCESS", data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/budget-items error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to delete budget item" },
      { status: 500 }
    );
  }
}