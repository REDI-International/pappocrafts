import { NextRequest, NextResponse } from "next/server";
import {
  validateSession,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  type OrderStatus,
} from "@/lib/admin-store";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  }

  const orders = await getAllOrders();
  return NextResponse.json(orders);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, paymentStatus } = await request.json();
    if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    if (status) {
      const updated = await updateOrderStatus(id, status as OrderStatus);
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(updated);
    }

    if (paymentStatus) {
      const updated = await updatePaymentStatus(id, paymentStatus);
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  const deleted = await deleteOrder(id);
  if (!deleted) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
