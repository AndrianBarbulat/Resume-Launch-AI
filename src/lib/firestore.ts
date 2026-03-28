import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Resume, ResumeFormData } from "./types";

const COL = "resumes";

export async function createResume(
  userId: string,
  data: ResumeFormData
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserResumes(userId: string): Promise<Resume[]> {
  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resume));
}

export async function getResume(resumeId: string): Promise<Resume | null> {
  const ref = doc(db, COL, resumeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Resume;
}

export async function updateResume(
  resumeId: string,
  data: Partial<ResumeFormData>
): Promise<void> {
  const ref = doc(db, COL, resumeId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteResume(resumeId: string): Promise<void> {
  await deleteDoc(doc(db, COL, resumeId));
}
