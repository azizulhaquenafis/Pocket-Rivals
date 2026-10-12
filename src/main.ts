import "@fontsource/fredoka/latin-600.css";
import "@fontsource/fredoka/latin-700.css";
import "@fontsource/nunito-sans/latin-700.css";
import "@fontsource/nunito-sans/latin-900.css";
import "./styles/app.css";
import { Capacitor } from "@capacitor/core";
import { GameManager } from "./core/GameManager";
await document.fonts.ready;
const app = new GameManager();
if (import.meta.env.DEV) {
  Object.defineProperty(window, "__POCKET__", {
    configurable: true,
    get: () => app.snapshot(),
  });
}
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());

if (
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  "serviceWorker" in navigator
) {
  void navigator.serviceWorker
    .register("./sw.js")
    .catch((error) => console.warn("Offline cache unavailable", error));
}
