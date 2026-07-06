import { detectPlatform, platformById } from "../lib/platform";

export function applyPlatformUi(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-detected-os]").forEach((el) => {
    el.textContent = platformById(detectPlatform()).shortLabel;
  });
}

export function initDownloadSheet() {
  const sheet = document.getElementById("download-sheet");
  const backdrop = document.getElementById("download-sheet-backdrop");
  if (!sheet || !backdrop) return;

  const open = () => {
    backdrop.classList.add("is-open");
    sheet.classList.add("is-open");
    document.body.classList.add("sheet-open");
  };

  const close = () => {
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
  };

  document.querySelectorAll("[data-download-sheet-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });

  document.querySelectorAll("[data-download-sheet-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) close();
  });
}

export function initSitePlatform() {
  applyPlatformUi(document);
  initDownloadSheet();
}

export { detectPlatform, platformById };
