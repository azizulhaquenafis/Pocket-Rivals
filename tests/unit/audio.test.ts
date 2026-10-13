import { it, expect, vi, afterEach } from "vitest";
import { AudioManager } from "../../src/core/AudioManager";
import { StorageManager } from "../../src/core/StorageManager";
afterEach(() => vi.unstubAllGlobals());
it("retains old scores and validates volume on restore", () => {
  const s = new StorageManager({
    getItem: () =>
      JSON.stringify({ version: 1, wins: [3, 4], volume: 9, sound: true }),
    setItem: () => {},
  });
  expect(s.data.wins).toEqual([3, 4]);
  expect(s.data.volume).toBe(1);
  expect(new StorageManager(undefined).data.volume).toBe(0.75);
});
it("caps procedural voices and clears them on background/disposal", () => {
  const param = () => ({
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    }),
    oscillators: any[] = [];
  class FakeAudio {
    state = "running";
    currentTime = 1;
    destination = {};
    createGain() {
      return { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
    }
    createOscillator() {
      const v = {
        frequency: param(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      oscillators.push(v);
      return v;
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", FakeAudio);
  const s = new StorageManager(undefined),
    a = new AudioManager(s);
  a.play("win");
  a.play("perfect");
  a.play("goal");
  a.play("metal");
  a.play("capture");
  expect(a.activeVoices).toBe(10);
  s.data.sound = false;
  a.play("fail");
  expect(oscillators).toHaveLength(10);
  a.suspend();
  expect(a.activeVoices).toBe(0);
  expect(oscillators.every((v) => v.stop.mock.calls.length >= 2)).toBe(true);
  a.dispose();
});
