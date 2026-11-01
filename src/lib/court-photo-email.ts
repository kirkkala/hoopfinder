import { isEmailAddress } from "@/components/add-court/AddCourtFields";

const PHOTO_EMAIL_KEY = "hoopfinder-photo-email";

/** Email from a photo this browser already uploaded. */
export function readPhotoEmail(): string {
  try {
    const saved = localStorage.getItem(PHOTO_EMAIL_KEY) ?? "";
    return isEmailAddress(saved) ? saved.trim() : "";
  } catch {
    return "";
  }
}

export function rememberPhotoEmail(email: string): void {
  const value = email.trim();
  try {
    if (!isEmailAddress(value)) return;
    localStorage.setItem(PHOTO_EMAIL_KEY, value);
  } catch {
    // Private mode can block storage. The upload still succeeds.
  }
}
