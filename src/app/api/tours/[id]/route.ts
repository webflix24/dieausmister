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
  const tour = await prisma.tour.findUnique({
    where: { id },
    include: { customer: true, employees: { include: { user: true } } },
  });
  if (!tour) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(tour);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { employeeIds, ...rest } = body;

  await prisma.tourEmployee.deleteMany({ where: { tourId: id } });

  const tour = await prisma.tour.update({
    where: { id },
    data: {
      ...rest,
      date: new Date(rest.date),
      employees: {
        create: (employeeIds ?? []).map((userId: string) => ({ userId })),
      },
    },
    include: { customer: true, employees: { include: { user: true } } },
  });

  return Response.json(tour);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.tour.delete({ where: { id } });
  return Response.json({ success: true });
}
