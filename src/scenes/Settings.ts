import { downloadCollection } from "../core/OfflineManager";
import type { GameManager } from "../core/GameManager";
import { escapeHtml } from "../core/StorageManager";
import { icons } from "../shared/components/icons";
export class Settings {
  constructor(private app: GameManager) {}
  private offlineStatus = "";
  private downloading = false;
  show() {
    const d = this.app.storage.data;
    const p1 = escapeHtml(this.app.storage.playerName(0));
    const p2 = escapeHtml(this.app.storage.playerName(1, false));
    const root = this.app.modal.show(
      `<button class="modal-close icon-button" data-action="close" aria-label="Close settings">${icons.close}</button><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2 id="dialog-title">The little details.</h2><div class="name-inputs"><label class="name-field orange"><span>Player 1 (Orange)</span><input aria-label="Player 1 name" type="text" maxlength="12" placeholder="Orange" value="${p1}"></label><label class="name-field blue"><span>Player 2 (Blue)</span><input aria-label="Player 2 name" type="text" maxlength="12" placeholder="Blue" value="${p2}"></label></div><div class="settings-rows"><button class="setting-row" data-action="sound" role="switch" aria-checked="${d.sound}"><span><b>Sound effects</b><small>Crisp tactile pops and chimes</small></span><span class="toggle ${d.sound ? "on" : ""}"></span></button><label class="setting-row"><span><b>Effects volume</b><small id="volume-label">${Math.round(d.volume * 100)}%</small></span><input aria-label="Effects volume" type="range" min="0" max="100" step="5" value="${Math.round(d.volume * 100)}" style="width:45%;accent-color:var(--orange)"></label></div><p class="settings-note">One phone. Two people. No internet, ads, or accounts. Scores stay on this device.${this.app.storage.persistent ? "" : " Storage is unavailable; scores last for this session."}</p>${navigator.serviceWorker?.controller ? `<button class="secondary-button" data-action="offline" ${this.downloading ? "disabled" : ""}>${this.downloading ? "Saving games…" : "Save all games offline"}</button><p role="status" class="settings-note">${this.offlineStatus || "Games download when first played. Save the collection for a trip."}</p>` : ""}<button class="secondary-button" data-action="reset">Reset the scoreboard</button><p class="version">POCKET RIVALS · v0.3.0</p>`,
      {
        close: () => {
          this.app.modal.close();
          this.app.refreshMenu();
        },
        sound: () => {
          this.app.toggleSound();
          this.show();
        },
        offline: async () => {
          this.downloading = true;
          this.show();
          try {
            await downloadCollection();
            this.offlineStatus = "All games saved. Ready to play offline.";
          } catch {
            this.offlineStatus =
              "Couldn’t finish the download. Check your connection and try again.";
          }
          this.downloading = false;
          if (
            this.app.modal.isOpen &&
            document.querySelector('[data-action="offline"]')
          )
            this.show();
        },
        reset: () => this.confirmReset(),
      },
    );
    const nameOne = root.querySelector<HTMLInputElement>(
      'input[aria-label="Player 1 name"]',
    )!;
    const nameTwo = root.querySelector<HTMLInputElement>(
      'input[aria-label="Player 2 name"]',
    )!;
    const saveNames = () => {
      this.app.storage.setPlayerNames(nameOne.value, nameTwo.value);
      this.app.refreshMenu();
    };
    nameOne.oninput = saveNames;
    nameTwo.oninput = saveNames;

    const volume = root.querySelector<HTMLInputElement>(
      'input[aria-label="Effects volume"]',
    )!;
    volume.oninput = () => {
      d.volume = Number(volume.value) / 100;
      this.app.storage.save();
      this.app.audio.syncSettings();
      root.querySelector("#volume-label")!.textContent = `${volume.value}%`;
    };
    volume.onchange = () => this.app.audio.play("tap");
  }
  editNames() {
    const p1 = escapeHtml(this.app.storage.playerName(0));
    const p2 = escapeHtml(this.app.storage.playerName(1, false));
    const root = this.app.modal.show(
      `<div class="eyebrow">MAKE IT PERSONAL</div><h2 id="dialog-title">Player names</h2><div class="name-inputs"><label class="name-field orange"><span>Player 1 (Orange)</span><input aria-label="Player 1 name" type="text" maxlength="12" placeholder="Orange" value="${p1}"></label><label class="name-field blue"><span>Player 2 (Blue)</span><input aria-label="Player 2 name" type="text" maxlength="12" placeholder="Blue" value="${p2}"></label></div><button class="primary-button" data-action="save">Save names</button><button class="text-button" data-action="reset">Reset to Orange & Blue</button>`,
      {
        save: () => {
          const i1 = root.querySelector<HTMLInputElement>(
            'input[aria-label="Player 1 name"]',
          )!;
          const i2 = root.querySelector<HTMLInputElement>(
            'input[aria-label="Player 2 name"]',
          )!;
          this.app.storage.setPlayerNames(i1.value, i2.value);
          this.app.audio.play("capture", 0.7);
          this.app.modal.close();
          this.app.refreshMenu();
        },
        reset: () => {
          this.app.storage.setPlayerNames("Orange", "Blue");
          this.app.audio.play("tap", 0.7);
          this.app.modal.close();
          this.app.refreshMenu();
        },
      },
      "names-modal",
      () => this.app.modal.close(),
    );
    const i1 = root.querySelector<HTMLInputElement>(
      'input[aria-label="Player 1 name"]',
    )!;
    const i2 = root.querySelector<HTMLInputElement>(
      'input[aria-label="Player 2 name"]',
    )!;
    const submitOnEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        root.querySelector<HTMLButtonElement>('[data-action="save"]')?.click();
      }
    };
    i1.onkeydown = submitOnEnter;
    i2.onkeydown = submitOnEnter;
    i1.focus();
    i1.select();
  }
  private confirmReset() {
    this.app.modal.show(
      `<div class="eyebrow">A CLEAN SLATE</div><h2 id="dialog-title">Friends again?</h2><p>This clears both players’ wins and match totals on this device.</p><button class="primary-button" data-action="reset">Yes, reset scores</button><button class="text-button" data-action="cancel">Keep the rivalry</button>`,
      {
        reset: () => {
          this.app.storage.resetScores();
          this.app.refreshMenu();
          this.show();
        },
        cancel: () => this.show(),
      },
    );
  }
}
