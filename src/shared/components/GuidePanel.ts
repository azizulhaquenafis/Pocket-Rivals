import { escapeHtml } from "../../core/StorageManager";
import { oppositeSideLayout } from "../utilities/DeviceLayout";

export interface GuideSwatchItem {
  label: string;
  detail: string;
  swatch?: string;
}

export interface GuidePanelOptions {
  instructions?: string;
  guideTitle?: string;
  guide?: readonly GuideSwatchItem[];
  controls?: readonly string[];
  showGlobalShortcuts?: boolean;
}

function renderKeyCaps(raw: string): string {
  return raw
    .split("/")
    .map((group) =>
      group
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((key) => `<kbd>${escapeHtml(key)}</kbd>`)
        .join(""),
    )
    .join('<span class="kbd-sep">/</span>');
}

export function renderControlsList(
  controls: readonly string[],
  showGlobalShortcuts = true,
): string {
  const rows = controls
    .map((entry) => {
      const parts = entry.split("|").map((p) => p.trim());
      if (parts.length === 3) {
        const [role, keys, action] = parts;
        const dotClass =
          role === "p2" ? "ctrl-dot blue" : role === "p1" ? "ctrl-dot orange" : "";
        return `<li class="ctrl-row">${dotClass ? `<span class="${dotClass}" aria-hidden="true"></span>` : ""}<span class="ctrl-keys">${renderKeyCaps(keys)}</span><span class="ctrl-action">${escapeHtml(action)}</span></li>`;
      }
      if (parts.length === 2) {
        const [keys, action] = parts;
        return `<li class="ctrl-row"><span class="ctrl-keys">${renderKeyCaps(keys)}</span><span class="ctrl-action">${escapeHtml(action)}</span></li>`;
      }
      return `<li class="ctrl-row"><span class="ctrl-action">${escapeHtml(entry)}</span></li>`;
    })
    .join("");
  const footer = showGlobalShortcuts
    ? `<div class="ctrl-global"><span><kbd>H</kbd> Help</span><span><kbd>Esc</kbd> Pause</span></div>`
    : "";
  return `<ul class="ctrl-list">${rows}</ul>${footer}`;
}

export function renderGuideRow(opts: GuidePanelOptions): string {
  const showControls = !oppositeSideLayout() && !!opts.controls?.length;
  const hasHowTo = !!(opts.instructions || opts.guide?.length);
  if (!hasHowTo && !showControls) return "";

  const howToLabel = opts.guideTitle ?? "How to play";
  const guideItems = opts.guide?.length
    ? `<ul class="guide-items arcade-guide">${opts.guide
        .map(
          (item) =>
            `<li>${item.swatch ? `<span class="guide-swatch" style="background:${item.swatch}"></span>` : ""}<div><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.detail)}</span></div></li>`,
        )
        .join("")}</ul>`
    : "";

  const howToPill = hasHowTo
    ? `<button type="button" class="guide-pill arcade-instructions" data-guide-open="howto" data-guide-title="${escapeHtml(howToLabel)}">${escapeHtml(howToLabel)}</button><template data-guide-tpl="howto">${opts.instructions ? `<p>${escapeHtml(opts.instructions)}</p>` : ""}${guideItems}</template>`
    : "";

  const controlsPill = showControls
    ? `<button type="button" class="guide-pill controls-box" data-guide-open="controls" data-guide-title="Controls">Controls</button><template data-guide-tpl="controls">${renderControlsList(opts.controls!, opts.showGlobalShortcuts !== false)}</template>`
    : "";

  return `<div class="guide-row${showControls && hasHowTo ? " split" : ""}">${howToPill}${controlsPill}</div>`;
}

/**
 * Opens How to play / Controls inside a compact floating popup window so the
 * setup screen never shifts or scrolls. Returns a disposer for scene teardown.
 */
export function bindGuideRow(root: ParentNode, mount?: HTMLElement): () => void {
  let backdrop: HTMLDivElement | null = null;
  let trigger: HTMLButtonElement | null = null;
  let onKeyDown: ((e: KeyboardEvent) => void) | null = null;

  const close = (restoreFocus = false) => {
    if (onKeyDown) {
      window.removeEventListener("keydown", onKeyDown, true);
      onKeyDown = null;
    }
    backdrop?.remove();
    backdrop = null;
    if (restoreFocus && trigger?.isConnected) {
      trigger.focus({ preventScroll: true });
    }
    trigger = null;
  };

  const resolveHost = (el: HTMLElement): HTMLElement => {
    if (mount?.isConnected) return mount;
    return (
      el.closest<HTMLElement>("#overlays") ??
      el.closest<HTMLElement>("#game-stage") ??
      document.querySelector<HTMLElement>("#game-stage") ??
      document.body
    );
  };

  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-guide-open]"),
  );
  const listeners: Array<[HTMLButtonElement, () => void]> = [];

  for (const btn of buttons) {
    const handler = () => {
      const kind = btn.dataset.guideOpen!;
      const title = btn.dataset.guideTitle || btn.textContent || "Info";
      const row = btn.closest(".guide-row");
      const tpl = row?.querySelector<HTMLTemplateElement>(
        `template[data-guide-tpl="${kind}"]`,
      );
      if (!tpl) return;

      close(false);
      trigger = btn;

      const overlay = document.createElement("div");
      overlay.className = "guide-popup-backdrop";
      overlay.setAttribute("role", "presentation");

      const dialog = document.createElement("div");
      dialog.className = "guide-popup";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", title);

      const head = document.createElement("div");
      head.className = "guide-popup-head";
      const h3 = document.createElement("h3");
      h3.textContent = title;
      const xBtn = document.createElement("button");
      xBtn.type = "button";
      xBtn.className = "guide-popup-close";
      xBtn.setAttribute("aria-label", `Close ${title}`);
      xBtn.textContent = "×";
      head.append(h3, xBtn);

      const body = document.createElement("div");
      body.className = "guide-popup-body";
      body.append(tpl.content.cloneNode(true));

      const done = document.createElement("button");
      done.type = "button";
      done.className = "guide-popup-done";
      done.textContent = "Got it";

      dialog.append(head, body, done);
      overlay.append(dialog);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(true);
      });
      xBtn.addEventListener("click", () => close(true));
      done.addEventListener("click", () => close(true));

      onKeyDown = (e: KeyboardEvent) => {
        if (!overlay.isConnected) {
          close(false);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          close(true);
        }
      };
      window.addEventListener("keydown", onKeyDown, true);

      backdrop = overlay;
      resolveHost(btn).append(overlay);
      done.focus({ preventScroll: true });
    };
    btn.addEventListener("click", handler);
    listeners.push([btn, handler]);
  }

  return () => {
    close(false);
    for (const [btn, handler] of listeners) {
      btn.removeEventListener("click", handler);
    }
  };
}
