import Phaser from "phaser";
interface Pulse {
  x: number;
  y: number;
  color: number;
  life: number;
}
export class Impacts {
  private pool: Pulse[] = Array.from({ length: 14 }, () => ({
    x: 0,
    y: 0,
    color: 0,
    life: 0,
  }));
  private cursor = 0;
  burst(x: number, y: number, color: number) {
    const p = this.pool[this.cursor++ % this.pool.length];
    p.x = x;
    p.y = y;
    p.color = color;
    p.life = 0.22;
  }
  draw(g: Phaser.GameObjects.Graphics, dt: number) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      const t = Math.max(0, p.life / 0.22);
      g.lineStyle(3 * t, p.color, t).strokeCircle(p.x, p.y, 8 + (1 - t) * 22);
    }
  }
}
