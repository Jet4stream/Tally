import { NextResponse } from "next/server";
import {
  postReimbursementController,
  getAllReimbursementsController,
  getOneReimbursementController,
  getReimbursementsByPayeeUserIdController,
  getReimbursementsByClubIdController,
  updateReimbursementController,
  deleteReimbursementWithFilesController,
} from "./controller";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/reimbursements
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ code: "ERROR", message: "Unauthorized", data: null }, { status: 401 });
    }

    const form = await req.formData();

    const clubId = String(form.get("clubId") ?? "");
    const clubName = String(form.get("clubName") ?? "");
    const payeeUserId = String(form.get("payeeUserId") ?? "");
    const budgetItemId = form.get("budgetItemId") ? String(form.get("budgetItemId")) : null;
    const amountCents = Number(form.get("amountCents") ?? 0);
    const description = String(form.get("description") ?? "");

    const receipt = form.get("receipt") as File | null;

    if (!clubId || !clubName || !payeeUserId || !Number.isFinite(amountCents)) {
      return NextResponse.json(
        { code: "ERROR", message: "Missing/invalid fields", data: null },
        { status: 400 }
      );
    }

    // Upload receipt (optional)
    let receiptFileUrl: string | null = null;

    if (receipt) {
      const ext = receipt.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${clubId}/${crypto.randomUUID()}/receipt.${ext}`;

      const bytes = new Uint8Array(await receipt.arrayBuffer());

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .upload(path, bytes, {
          contentType: receipt.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadErr) {
        return NextResponse.json(
          { code: "ERROR", message: `Upload failed: ${uploadErr.message}`, data: null },
          { status: 500 }
        );
      }

      // Store stable reference (private-bucket friendly)
      receiptFileUrl = `supabase://${SUPABASE_BUCKET}/${path}`;
    }

    // Call controller to create reimbursement
    const r = await postReimbursementController({
      clubId,
      clubName,
      createdUserId: userId,     
      payeeUserId,
      budgetItemId,
      amountCents,
      description,
      receiptFileUrl,        
    });

    return NextResponse.json(
      { code: "SUCCESS", message: "Reimbursement created", data: r },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/reimbursements error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Failed to create reimbursement", data: null },
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
      return NextResponse.json(
        { code: "ERROR", message: "Missing id" },
        { status: 400 }
      );
    }

    await deleteReimbursementWithFilesController(id);

    return NextResponse.json({ code: "SUCCESS" });
  } catch (error: any) {
    console.error("DELETE reimbursement error:", error);
    return NextResponse.json(
      { code: "ERROR", message: error?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}