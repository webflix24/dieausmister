/**
 * POST /api/integrations/drive
 *
 * Endpunkt für den Upload von Vorher/Nachher-Fotos.
 * Wird vom Mitarbeiter-Frontend (Handy) aufgerufen.
 *
 * Request: multipart/form-data
 *   - file: Bilddatei
 *   - tourId: Tour-ID
 *   - customerId: Kunden-ID
 *   - phase: "before" | "after"
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { uploadPhoto } from "@/services/googleDriveService";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tourId = formData.get("tourId") as string | null;
  const customerId = formData.get("customerId") as string | null;
  const phase = formData.get("phase") as "before" | "after" | null;

  if (!file || !tourId || !customerId || !phase) {
    return Response.json({ error: "file, tourId, customerId und phase sind Pflichtfelder" }, { status: 400 });
  }

  if (phase !== "before" && phase !== "after") {
    return Response.json({ error: "phase muss 'before' oder 'after' sein" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const result = await uploadPhoto({
    customerId,
    tourId,
    phase,
    fileName: file.name,
    fileBuffer,
    mimeType: file.type || "image/jpeg",
  });

  return Response.json({ ok: true, ...result });
}
