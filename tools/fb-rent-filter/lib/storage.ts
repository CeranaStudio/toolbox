import type { RentRecord } from "./schema";

const STORAGE_KEY = "fb-rent-records";

export function getRecords(): RentRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RentRecord[];
  } catch {
    return [];
  }
}

export function saveRecords(records: RentRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function addRecords(newRecords: RentRecord[]): RentRecord[] {
  const existing = getRecords();
  const merged = [...existing, ...newRecords];
  saveRecords(merged);
  return merged;
}

export function deleteRecord(id: string): RentRecord[] {
  const records = getRecords().filter((r) => r.id !== id);
  saveRecords(records);
  return records;
}

export function updateRecord(id: string, patch: Partial<RentRecord>): RentRecord[] {
  const records = getRecords().map((r) =>
    r.id === id ? { ...r, ...patch } : r
  );
  saveRecords(records);
  return records;
}
