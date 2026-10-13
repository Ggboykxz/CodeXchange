import { beforeEach, expect, test } from "vitest";
import { stockerImage, stockageDistantActif } from "../src/lib/storage";

beforeEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+cQAAAABJRU5ErkJggg==";

test("sans BLOB_READ_WRITE_TOKEN, le data URL est conservé tel quel", async () => {
  expect(stockageDistantActif()).toBe(false);
  expect(await stockerImage(PNG_1PX, "avatars/1")).toBe(PNG_1PX);
});

test("un data URL invalide lève une erreur", async () => {
  await expect(stockerImage("pas-un-data-url", "avatars/1")).rejects.toThrow();
});

test("avec BLOB_READ_WRITE_TOKEN, l'upload distant est tenté", async () => {
  // On simule l'échec réseau : la fonction doit propager l'erreur (comportement attendu
  // pour du stockage distant — un échec ne doit pas être silencieux).
  process.env.BLOB_READ_WRITE_TOKEN = "jeton-de-test";
  expect(stockageDistantActif()).toBe(true);
  await expect(stockerImage(PNG_1PX, "avatars/1")).rejects.toThrow();
});
