import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });
  if (!quote) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(quote);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { items, ...rest } = body;

  const totalAmount = (items ?? []).reduce(
    (sum: number, item: { total: number }) => sum + item.total,
    0
  );

  await prisma.quoteItem.deleteMany({ where: { quoteId: id } });

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...rest,
      totalAmount,
      validUntil: rest.validUntil ? new Date(rest.validUntil) : null,
      items: {
        create: (items ?? []).map((item: {
          description: string;
          quantity: number;
          unit: string;
          unitPrice: number;
          total: number;
        }) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: { customer: true, items: true },
  });

  return Response.json(quote);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.quote.delete({ where: { id } });
  return Response.json({ success: true });
}
