import type {GameManager} from "../core/GameManager";
import {icons} from "../shared/components/icons";
export class Settings {constructor(private app:GameManager){}
  show() {
    const d = this.app.storage.data;
    this.app.modal.show(
      `<button class="modal-close icon-button" data-action="close" aria-label="Close settings">${icons.close}</button><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2 id="dialog-title">The little details.</h2><div class="settings-rows"><button class="setting-row" data-action="sound" role="switch" aria-checked="${d.sound}"><span><b>Sound effects</b><small>A little pop with every play</small></span><span class="toggle ${d.sound ? "on" : ""}"></span></button><button class="setting-row" data-action="music" role="switch" aria-checked="${d.music}"><span><b>Music</b><small>No soundtrack in this collection yet</small></span><span class="toggle ${d.music ? "on" : ""}"></span></button></div><p class="settings-note">One phone. Two people. No internet, ads, or accounts. Scores stay on this device.${this.app.storage.persistent ? "" : " Storage is unavailable; scores last for this session."}</p><button class="secondary-button" data-action="reset">Reset the scoreboard</button><p class="version">POCKET RIVALS · v0.1.0</p>`,
      {
        close: () => {
          this.app.modal.close();
          this.app.refreshMenu();
        },
        sound: () => {
          this.app.toggleSound();
          this.show();
        },
        music: () => {
          d.music = !d.music;
          this.app.storage.save();
          this.show();
        },
        reset: () => this.confirmReset(),
      },
    );
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
