/** Explicit web download; Capacitor already packages all registered modules. */
export async function downloadCollection() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) throw Error("Offline caching is not ready");
  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel(),
      timeout = setTimeout(() => {
        channel.port1.close();
        reject(Error("Download timed out"));
      }, 60000);
    channel.port1.onmessage = ({ data }) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (data.ok) resolve();
      else reject(Error("Download failed"));
    };
    controller.postMessage({ type: "CACHE_ALL" }, [channel.port2]);
  });
}
