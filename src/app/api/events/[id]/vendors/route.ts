import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EventRepo } from "@/server/repositories/event.repo";
import { VendorRepo } from "@/server/repositories/vendor.repo";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const vendors = VendorRepo.getVendorsByEventId(eventId);
    return successResponse(vendors);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { category, name, contact_info, status, notes, quote_amount_minor, advance_paid_minor } = body;

    if (!category || !name) {
      return errorResponse("Category and name are required", "VALIDATION_ERROR", 400);
    }

    const vendor = VendorRepo.createVendor({
      eventId,
      category,
      name,
      contact_info,
      status: status || "NOT_STARTED",
      notes,
    });

    if (quote_amount_minor !== undefined && quote_amount_minor > 0) {
      VendorRepo.addQuote({
        vendorId: vendor.id,
        amountMinor: Number(quote_amount_minor),
        advancePaidMinor: Number(advance_paid_minor || 0),
        currency: event.currency,
      });
    }

    const fullVendor = VendorRepo.findById(vendor.id);
    return successResponse(fullVendor, 201);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const event = EventRepo.findByIdAndOwner(eventId, user.id);
    if (!event) return errorResponse("Event not found", "NOT_FOUND", 404);

    const body = await req.json();
    const { vendorId, status, quote_amount_minor, advance_paid_minor, notes } = body;

    if (!vendorId) return errorResponse("vendorId is required", "VALIDATION_ERROR", 400);

    if (status) {
      VendorRepo.updateVendorStatus(vendorId, eventId, status);
    }

    if (quote_amount_minor !== undefined) {
      VendorRepo.addQuote({
        vendorId,
        amountMinor: Number(quote_amount_minor),
        advancePaidMinor: Number(advance_paid_minor || 0),
        currency: event.currency,
        notes,
      });
    }

    const updated = VendorRepo.findById(vendorId);
    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) return errorResponse("vendorId is required", "VALIDATION_ERROR", 400);

    const deleted = VendorRepo.deleteVendor(vendorId, eventId);
    if (!deleted) return errorResponse("Vendor not found", "NOT_FOUND", 404);

    return successResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, "INTERNAL_ERROR", 500);
  }
}
