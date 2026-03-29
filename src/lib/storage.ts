import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Storage path pattern: resumes/{userId}/{resumeId}/resume.pdf
 *
 * Using a fixed leaf name ("resume.pdf") means the URL is fully derivable
 * from userId + resumeId, so `getResumePDFUrl` needs no extra metadata.
 * The human-readable `filename` param is written into the upload metadata
 * so Firebase serves a sensible Content-Disposition header on download.
 */
function pdfRef(userId: string, resumeId: string) {
  return ref(storage, `resumes/${userId}/${resumeId}/resume.pdf`);
}

/**
 * Upload a PDF Blob to Firebase Storage and return the public download URL.
 *
 * @param filename  The user-facing download name (e.g. "John_Doe_Resume.pdf")
 */
export async function uploadResumePDF(
  userId: string,
  resumeId: string,
  blob: Blob,
  filename: string
): Promise<string> {
  const storageRef = pdfRef(userId, resumeId);
  await uploadBytes(storageRef, blob, {
    contentType: "application/pdf",
    contentDisposition: `attachment; filename="${filename}"`,
  });
  return getDownloadURL(storageRef);
}

/**
 * Return the download URL for an already-uploaded resume PDF,
 * or null if no PDF has been saved yet.
 */
export async function getResumePDFUrl(
  userId: string,
  resumeId: string
): Promise<string | null> {
  try {
    return await getDownloadURL(pdfRef(userId, resumeId));
  } catch {
    return null;
  }
}

/**
 * Delete the saved PDF from Firebase Storage.
 * Silently succeeds if the file doesn't exist.
 */
export async function deleteResumePDF(
  userId: string,
  resumeId: string
): Promise<void> {
  try {
    await deleteObject(pdfRef(userId, resumeId));
  } catch {
    // File may not exist — not an error
  }
}
