import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@dieausmister.de" } });
  if (existing) {
    return Response.json({ message: "Bereits geseeded." });
  }

  const adminPass = await bcrypt.hash("Admin1234!", 10);
  const empPass = await bcrypt.hash("Mitarbeiter1!", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@dieausmister.de", name: "Flamur Sahiti", password: adminPass, role: "ADMIN" },
  });

  const emp1 = await prisma.user.create({
    data: { email: "max@dieausmister.de", name: "Max Mustermann", password: empPass, role: "EMPLOYEE" },
  });

  const emp2 = await prisma.user.create({
    data: { email: "anna@dieausmister.de", name: "Anna Schmidt", password: empPass, role: "EMPLOYEE" },
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        firstName: "Karl",
        lastName: "Bergmann",
        email: "k.bergmann@email.de",
        phone: "0176 1234 5678",
        address: "Hauptstraße 12",
        city: "München",
        postalCode: "80331",
        notes: "Erdgeschoss, großes Wohnzimmer",
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Helga",
        lastName: "Fischer",
        phone: "089 / 987 654",
        address: "Schillerstr. 4",
        city: "München",
        postalCode: "80336",
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Thomas",
        lastName: "Weber",
        email: "weber.t@web.de",
        phone: "0151 9988 7766",
        address: "Goethestr. 21",
        city: "Augsburg",
        postalCode: "86150",
        notes: "3 Zimmer, 2. OG ohne Aufzug",
      },
    }),
  ]);

  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: "ANG-2026-1001",
      status: "SENT",
      customerId: customers[0].id,
      totalAmount: 1250,
      validUntil: new Date("2026-07-01"),
      notes: "Inklusive Sperrmüll-Entsorgung",
      items: {
        create: [
          { description: "Wohnungsauflösung (Stunden)", quantity: 8, unit: "Std.", unitPrice: 85, total: 680 },
          { description: "Sperrmüll-Entsorgung", quantity: 1, unit: "Pausch.", unitPrice: 350, total: 350 },
          { description: "Fahrtkosten", quantity: 1, unit: "Pausch.", unitPrice: 120, total: 120 },
          { description: "Reinigung", quantity: 1, unit: "Pausch.", unitPrice: 100, total: 100 },
        ],
      },
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      quoteNumber: "ANG-2026-1002",
      status: "DRAFT",
      customerId: customers[2].id,
      totalAmount: 680,
      items: {
        create: [
          { description: "Entrümpelung 3-Zimmer-Wohnung", quantity: 5, unit: "Std.", unitPrice: 85, total: 425 },
          { description: "Fahrtkosten", quantity: 1, unit: "Pausch.", unitPrice: 95, total: 95 },
          { description: "Sperrmüll klein", quantity: 2, unit: "m³", unitPrice: 80, total: 160 },
        ],
      },
    },
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.tour.create({
    data: {
      title: "Wohnungsauflösung Bergmann",
      date: today,
      startTime: "08:00",
      endTime: "16:00",
      customerId: customers[0].id,
      address: "Hauptstraße 12",
      city: "München",
      status: "PLANNED",
      notes: "Erdgeschoss, Transporter nötig",
      employees: {
        create: [{ userId: admin.id }, { userId: emp1.id }],
      },
    },
  });

  await prisma.tour.create({
    data: {
      title: "Beratungstermin Fischer",
      date: tomorrow,
      startTime: "10:00",
      endTime: "11:30",
      customerId: customers[1].id,
      address: "Schillerstr. 4",
      city: "München",
      status: "PLANNED",
      employees: {
        create: [{ userId: emp1.id }],
      },
    },
  });

  await prisma.tour.create({
    data: {
      title: "Entrümpelung Weber",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
      startTime: "07:30",
      endTime: "15:00",
      customerId: customers[2].id,
      address: "Goethestr. 21",
      city: "Augsburg",
      status: "PLANNED",
      notes: "2. OG ohne Aufzug – Vorsicht!",
      employees: {
        create: [{ userId: emp1.id }, { userId: emp2.id }],
      },
    },
  });

  return Response.json({ message: "Seed erfolgreich!", adminEmail: "admin@dieausmister.de", password: "Admin1234!" });
}
