import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let dateFilter = {};
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    dateFilter = { date: { gte: start, lte: end } };
  }

  const tours = await prisma.tour.findMany({
    where: dateFilter,
    include: {
      customer: true,
      employees: { include: { user: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return Response.json(tours);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { employeeIds, ...rest } = body;

  const tour = await prisma.tour.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      employees: {
        create: (employeeIds ?? []).map((userId: string) => ({ userId })),
      },
    },
    include: { customer: true, employees: { include: { user: true } } },
  });

  return Response.json(tour, { status: 201 });
}
