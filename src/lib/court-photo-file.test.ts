import { expect, test, vi } from "vitest";
import { COURT_PHOTO_REQUEST_BYTES } from "@/lib/constants";
import { fileForCourtUpload, fittedSize } from "./court-photo-file";

test("fits the longest side inside the upload edge", () => {
  expect(fittedSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  expect(fittedSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  expect(fittedSize(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 });
});

test("sends a small jpeg through unchanged", async () => {
  const create = vi.fn();
  vi.stubGlobal("createImageBitmap", create);
  const file = new File([new Uint8Array([1, 2, 3])], "court.jpg", { type: "image/jpeg" });

  await expect(fileForCourtUpload(file)).resolves.toBe(file);
  expect(create).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

test("redraws a photo larger than the Vercel request limit", async () => {
  const bytes = new Uint8Array(COURT_PHOTO_REQUEST_BYTES + 1);
  const file = new File([bytes], "IMG_0001.JPEG", { type: "image/jpeg" });
  vi.stubGlobal("createImageBitmap", async () => ({
    width: 4032,
    height: 3024,
    close: () => {},
  }));
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName !== "canvas") return realCreate(tagName);
    return {
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: "",
        fillRect: () => {},
        drawImage: () => {},
      }),
      toBlob: (callback: (blob: Blob | null) => void) => {
        callback(new Blob([new Uint8Array(2000)], { type: "image/jpeg" }));
      },
    } as unknown as HTMLCanvasElement;
  });

  const upload = await fileForCourtUpload(file);

  expect(upload).not.toBe(file);
  expect(upload.type).toBe("image/jpeg");
  expect(upload.name).toBe("IMG_0001.jpg");
  expect(upload.size).toBeLessThanOrEqual(COURT_PHOTO_REQUEST_BYTES);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
