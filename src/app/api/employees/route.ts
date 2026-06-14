import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return Response.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as SessionUser;
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role } = body;
  const hashed = await bcrypt.hash(password, 10);
  const employee = await prisma.user.create({
    data: { name, email, password: hashed, role: role ?? "EMPLOYEE" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(employee, { status: 201 });
}
