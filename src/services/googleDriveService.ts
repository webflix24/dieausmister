/**
 * Google Drive API Integration
 *
 * Lädt Vorher/Nachher-Bilder in spezifische Kundenordner hoch.
 * Ordnerstruktur:
 *   Die Ausmister/
 *     Kunden/
 *       {Kundename}/
 *         {Datum} - {Tourname}/
 *           Vorher/
 *           Nachher/
 *
 * Docs: https://developers.google.com/drive/api/v3
 * ENV:  GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_ROOT_FOLDER_ID
 *
 * Authentifizierung: Service Account (empfohlen für Server-zu-Server)
 *   1. Google Cloud Console → Service Account erstellen
 *   2. Drive API aktivieren
 *   3. JSON-Key herunterladen
 *   4. Ordner mit Service Account teilen (Editor-Rolle)
 */

import axios from "axios";
import { prisma } from "@/lib/db";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

/** Holt ein Google OAuth2 Access Token via Service Account (JWT) */
async function getAccessToken(): Promise<string> {
  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error("GOOGLE_CLIENT_EMAIL nicht konfiguriert");
  }

  // JWT für Service Account erstellen
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // JWT signieren (RS256) – vereinfachte Implementierung via node crypto
  const { createSign } = await import("crypto");
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${header}.${body}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await axios.post("https://oauth2.googleapis.com/token", {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  return res.data.access_token;
}

/** Erstellt einen Ordner in Google Drive */
async function createFolder(name: string, parentId: string, token: string): Promise<string> {
  const res = await axios.post(
    `${DRIVE_API}/files`,
    {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

/** Sucht einen Ordner oder erstellt ihn wenn nicht vorhanden */
async function getOrCreateFolder(name: string, parentId: string, token: string): Promise<string> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await axios.get(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.data.files.length > 0) return res.data.files[0].id;
  return createFolder(name, parentId, token);
}

export interface UploadPhotoParams {
  customerId: string;
  tourId: string;
  phase: "before" | "after";
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

/**
 * Lädt ein Foto in den Kundenordner hoch.
 * Erstellt die Ordnerstruktur automatisch wenn nicht vorhanden.
 *
 * MOCK: Wenn keine Google-Credentials konfiguriert sind, wird der Upload simuliert.
 */
export async function uploadPhoto(params: UploadPhotoParams): Promise<{ fileId: string; webViewLink: string }> {
  const isMock = !process.env.GOOGLE_CLIENT_EMAIL;

  if (isMock) {
    console.log(`[drive MOCK] Upload: ${params.fileName} (${params.phase}) für Tour ${params.tourId}`);
    return { fileId: `mock-file-${Date.now()}`, webViewLink: "https://drive.google.com/mock" };
  }

  const token = await getAccessToken();
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  // Kundendaten aus DB
  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  const tour = await prisma.tour.findUnique({ where: { id: params.tourId } });
  if (!customer || !tour) throw new Error("Kunde oder Tour nicht gefunden");

  const customerName = `${customer.firstName} ${customer.lastName}`;
  const tourDate = tour.date.toISOString().split("T")[0];
  const folderName = `${tourDate} - ${tour.title}`;
  const subfolderName = params.phase === "before" ? "Vorher" : "Nachher";

  // Ordnerstruktur aufbauen
  const kundenOrdner = await getOrCreateFolder("Kunden", rootId, token);
  const kundeOrdner = await getOrCreateFolder(customerName, kundenOrdner, token);
  const tourOrdner = await getOrCreateFolder(folderName, kundeOrdner, token);
  const phaseOrdner = await getOrCreateFolder(subfolderName, tourOrdner, token);

  // Foto hochladen (multipart upload)
  const metadata = JSON.stringify({ name: params.fileName, parents: [phaseOrdner] });
  const boundary = "-------314159265358979323846";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(metadata),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`),
    params.fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadRes = await axios.post(
    `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,webViewLink`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
    }
  );

  const fileId = uploadRes.data.id;
  const webViewLink = uploadRes.data.webViewLink;

  // Tour-Ordner-ID in DB speichern für spätere Referenz
  if (params.phase === "before") {
    await prisma.tour.update({ where: { id: params.tourId }, data: { driveFolderBefore: tourOrdner } });
  } else {
    await prisma.tour.update({ where: { id: params.tourId }, data: { driveFolderAfter: tourOrdner } });
  }

  return { fileId, webViewLink };
}
