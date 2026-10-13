export class Modal {
  private root = document.querySelector<HTMLElement>("#overlays")!;
  private previous: HTMLElement | null = null;
  private backAction?: () => void;
  get isOpen() {
    return this.root.childElementCount > 0;
  }
  show(
    content: string,
    actions: Record<string, () => void>,
    className = "",
    back?: () => void,
  ) {
    if (!this.isOpen) this.previous = document.activeElement as HTMLElement;
    this.backAction = back;
    for (const id of ["#menu", "#game-stage"]) {
      const node = document.querySelector<HTMLElement>(id)!;
      node.inert = true;
      node.setAttribute("aria-hidden", "true");
    }
    const focused = (document.activeElement as HTMLElement)?.dataset.action;
    let panel = this.root.querySelector<HTMLElement>(".modal");
    if (!panel) {
      this.root.innerHTML =
        '<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"></section></div>';
      panel = this.root.querySelector<HTMLElement>(".modal")!;
    }
    panel.className = `modal ${className}`;
    panel.innerHTML = content;
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-action]")
      .forEach((b) => (b.onclick = () => actions[b.dataset.action!]?.()));
    (focused
      ? this.root.querySelector<HTMLButtonElement>(
          `[data-action="${CSS.escape(focused)}"]`,
        )
      : null
    )?.focus({ preventScroll: true });
    if (!this.root.contains(document.activeElement))
      this.root
        .querySelector<HTMLButtonElement>("button:not([disabled])")
        ?.focus({ preventScroll: true });
    return this.root;
  }
  back() {
    if (this.backAction) this.backAction();
    else this.close();
  }
  close() {
    this.root.replaceChildren();
    this.backAction = undefined;
    for (const id of ["#menu", "#game-stage"]) {
      const node = document.querySelector<HTMLElement>(id)!;
      node.inert = false;
      node.removeAttribute("aria-hidden");
    }
    if (this.previous?.isConnected)
      this.previous.focus({ preventScroll: true });
    this.previous = null;
  }
  trapFocus(e: KeyboardEvent) {
    if (e.key !== "Tab" || !this.isOpen) return;
    const list = Array.from(
      this.root.querySelectorAll<HTMLElement>(
        "button:not([disabled]),a[href],input,select",
      ),
    );
    const first = list[0],
      last = list.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
}
