import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuoteNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  const quotes = await prisma.quote.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(status === "open" ? { status: { in: ["DRAFT", "SENT"] } } : {}),
      ...(status && status !== "open" ? { status } : {}),
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(quotes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, customerId, notes, validUntil, status } = body;

  const totalAmount = (items ?? []).reduce(
    (sum: number, item: { total: number }) => sum + item.total,
    0
  );

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: generateQuoteNumber(),
      customerId,
      status: status ?? "DRAFT",
      totalAmount,
      notes,
      validUntil: validUntil ? new Date(validUntil) : null,
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

  return Response.json(quote, { status: 201 });
}
