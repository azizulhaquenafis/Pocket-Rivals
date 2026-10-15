import type Phaser from "phaser";
import { theme } from "../../../core/ThemeManager";
import { GolfView } from "./GolfInput";
import { GolfPhysics } from "./GolfPhysics";
import type { Point, Rect } from "./courses";
import { oil } from "./courses/foundry";
import { difficulties } from "./GolfRules";
export class GolfRenderer {
  private lastAim: Point | null = null;
  private previewPoints: Point[] = [];
  private g: Phaser.GameObjects.Graphics;
  private frame: Phaser.GameObjects.Graphics;
  private maskShape: Phaser.GameObjects.Graphics;
  private mask: Phaser.Display.Masks.GeometryMask;
  constructor(
    scene: Phaser.Scene,
    readonly view: GolfView,
  ) {
    this.frame = scene.add.graphics();
    this.g = scene.add.graphics();
    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    const r = view.bounds;
    this.maskShape.fillStyle(0xffffff).fillRect(r.x, r.y, r.w, r.h);
    this.mask = this.maskShape.createGeometryMask();
    this.g.setMask(this.mask);
  }
  draw(
    world: GolfPhysics,
    aim: Point | null,
    rival?: Point,
    playerColor = theme.orange,
  ) {
    const g = this.g,
      c = world.course,
      d = world.dynamics,
      s = this.view.scale;
    const bounds = this.view.bounds,
      origin = this.view.project({ x: 0, y: 0 });
    this.maskShape
      .clear()
      .fillStyle(0xffffff)
      .fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    this.frame
      .clear()
      .lineStyle(3, theme.ink)
      .strokeRoundedRect(
        bounds.x - 1,
        bounds.y - 1,
        bounds.w + 2,
        bounds.h + 2,
        8,
      );
    g.clear()
      .setPosition(origin.x, origin.y)
      .setRotation(this.view.angle)
      .setScale(s);
    const rect = (r: Rect, color: number, line = 3) => {
      g.fillStyle(color).fillRect(r.x, r.y, r.w, r.h);
      if (line) g.lineStyle(line, theme.ink).strokeRect(r.x, r.y, r.w, r.h);
    };
    const circle = (p: Point, r: number, color: number, line = 3) => {
      g.fillStyle(color).fillCircle(p.x, p.y, r);
      if (line) g.lineStyle(line, theme.ink).strokeCircle(p.x, p.y, r);
    };
    rect(
      { x: 0, y: 0, w: 1920, h: 1080 },
      c.id === "horizon"
        ? 0x46415d
        : c.id === "shoreline"
          ? 0x8fcbd8
          : 0xd8e8bf,
      0,
    );
    if (c.ground)
      for (const r of c.ground)
        rect(r, c.id === "shoreline" ? 0xf6df9c : 0xd9cfe8, 3);
    if (c.river) rect(c.river, theme.blue, 0);
    c.bridges?.forEach((r) => rect(r, d.bridgeSafe() ? 0xf7edcc : 0x6eafcb, 2));
    c.planks?.forEach((row, b) =>
      row.forEach((r, i) => {
        const t = d.planks[b * 5 + i],
          limit = [0.5, 0.2][b];
        if (t < limit) {
          rect(r, t > 0 ? 0xf3b078 : 0xe6c58f, 3);
          if (t > 0)
            g.lineStyle(3, theme.ink).lineBetween(
              r.x + 4,
              r.y + 10,
              r.x + r.w - 4,
              r.y + r.h - 10,
            );
        }
      }),
    );
    const colors = {
      slick: 0x9eaaa2,
      sand: 0xe7c477,
      belt: 0xeab976,
      ford: 0x90cace,
      mud: 0xb8987e,
      quicksand: 0xe8c77c,
      wind: 0xaeb7e7,
    };
    c.surfaces.forEach((r) => {
      rect(r, colors[r.kind], 0);
      if (r.push) {
        for (let i = 0; i < 3; i++) {
          const x = r.x + (r.w * (i + 1)) / 4,
            y = r.y + r.h / 2,
            dx = Math.sign(r.push.x) * 12,
            dy = Math.sign(r.push.y) * 12;
          g.lineStyle(4, theme.ink, 0.5).lineBetween(
            x - dx,
            y - dy,
            x + dx,
            y + dy,
          );
          g.fillStyle(theme.ink, 0.5).fillCircle(x + dx, y + dy, 4);
        }
      } else
        for (let i = 0; i < 5; i++)
          g.fillStyle(theme.ink, 0.15).fillCircle(
            r.x + (r.w * (i + 0.5)) / 5,
            r.y + r.h * 0.55,
            4,
          );
    });
    if (c.id === "foundry") circle(oil, oil.r, 0x7c8d88, 2);
    c.fields.forEach((f) => {
      g.lineStyle(3, theme.blue, 0.45)
        .strokeCircle(f.x, f.y, f.r)
        .strokeCircle(f.x, f.y, f.r * 0.6);
      if (f.core)
        circle(f, f.core, c.id === "foundry" ? theme.orange : 0xc6a3d0, 4);
      else circle(f, 16, 0x536a86, 3);
    });
    c.lava?.forEach((v) => {
      circle(v, v.r, theme.orange, 4);
      circle(v, v.r * 0.6, 0xf7d378, 0);
    });
    c.circles.forEach((v) => {
      circle(v, v.r, v.bounce ? theme.orange : theme.blue, 4);
      circle(v, v.r * 0.45, theme.white, 2);
    });
    c.walls.forEach((r) => rect(r, c.id === "temple" ? 0x849a78 : 0x788b85, 4));
    if (c.diamond) {
      g.save();
      g.translateCanvas(c.diamond.x, c.diamond.y);
      g.rotateCanvas(Math.PI / 4);
      rect(
        {
          x: -c.diamond.r / Math.SQRT2,
          y: -c.diamond.r / Math.SQRT2,
          w: c.diamond.r * Math.SQRT2,
          h: c.diamond.r * Math.SQRT2,
        },
        theme.orange,
        4,
      );
      g.restore();
    }
    for (let i = 0; i < c.movers.length; i++) {
      const m = d.mover(i);
      if (m.r) circle(m, m.r, c.id === "horizon" ? 0xa79fb7 : 0x8f9b83, 5);
      else
        rect(
          { ...m, w: m.w!, h: m.h! },
          c.id === "shoreline" ? theme.orange : theme.blue,
          4,
        );
    }
    c.fans.forEach((f) => {
      g.save();
      g.translateCanvas(f.x, f.y);
      g.rotateCanvas((d.time * f.spin * Math.PI) / 180);
      rect({ x: -f.length / 2, y: -6, w: f.length, h: 12 }, theme.orange, 3);
      rect({ x: -6, y: -f.length / 2, w: 12, h: f.length }, theme.orange, 3);
      g.restore();
      circle(f, f.hub, theme.ink, 0);
    });
    const piston = d.piston();
    if (piston) rect(piston, theme.orange, 4);
    c.lasers.forEach((r, i) => {
      rect(r, d.laser(i) ? 0xe56859 : 0xdcb3a6, 0);
      circle({ x: r.x, y: r.y }, 7, d.laser(i) ? theme.ink : theme.white, 2);
      circle(
        { x: r.x + r.w, y: r.y + r.h },
        7,
        d.laser(i) ? theme.ink : theme.white,
        2,
      );
    });
    c.plates?.forEach((p, i) => {
      circle(
        p,
        26,
        (i === 0 ? d.gate > 0 : d.plates[i]) ? theme.blue : 0xf1d583,
        4,
      );
      circle(p, 12, theme.white, 2);
    });
    c.doors?.forEach((_, i) =>
      rect(d.door(i), d.doors[i] > 0.95 ? theme.blue : theme.orange, 5),
    );
    c.portals?.forEach((p, i) => {
      const color = [theme.orange, theme.blue, 0xc398d4][i];
      circle(p.from, 26, color, 4);
      circle(p.from, 13, theme.ink, 0);
      g.lineStyle(5, color).strokeCircle(p.to.x, p.to.y, 26);
      const a = (p.angle * Math.PI) / 180;
      g.lineStyle(4, color).lineBetween(
        p.to.x,
        p.to.y,
        p.to.x + Math.cos(a) * 40,
        p.to.y + Math.sin(a) * 40,
      );
    });
    const u = d.ufo;
    if (u.active) {
      if (u.carry > 0 || u.hover > 0)
        g.fillStyle(theme.blue, 0.3).fillCircle(u.x, u.y, 80);
      g.fillStyle(theme.blue).fillEllipse(u.x, u.y, 90, 36);
      g.lineStyle(4, theme.ink).strokeEllipse(u.x, u.y, 90, 36);
      circle({ x: u.x, y: u.y }, 18, theme.white, 3);
    }
    circle(c.hole, 11, theme.ink, 0);
    g.lineStyle(4, theme.ink).lineBetween(
      c.hole.x,
      c.hole.y,
      c.hole.x + 42,
      c.hole.y,
    );
    g.fillStyle(theme.orange).fillTriangle(
      c.hole.x + 42,
      c.hole.y,
      c.hole.x + 42,
      c.hole.y - 30,
      c.hole.x + 20,
      c.hole.y,
    );
    if (aim && world.shootable) {
      const b = world.ball,
        speed = Math.hypot(aim.x, aim.y),
        preview = difficulties[world.difficulty].preview;
      g.lineStyle(3, theme.ink, 0.6).lineBetween(
        b.x,
        b.y,
        b.x - aim.x / 3.125,
        b.y - aim.y / 3.125,
      );
      if (c.id === "horizon" && preview && speed) {
        if (this.lastAim !== aim) {
          this.previewPoints = world.preview(aim);
          this.lastAim = aim;
        }
        this.previewPoints.forEach((p, i) =>
          g
            .fillStyle(theme.white, 1 - i / (this.previewPoints.length + 4))
            .fillCircle(p.x, p.y, 4),
        );
      } else if (preview && speed) {
        const len = speed * preview - 55 * preview * preview;
        for (let i = 1; i <= 12; i++)
          g.fillStyle(theme.white, 1 - i / 15).fillCircle(
            b.x + ((aim.x / speed) * len * i) / 12,
            b.y + ((aim.y / speed) * len * i) / 12,
            4,
          );
      }
    }
    if (rival) {
      g.lineStyle(3, theme.blue, 0.85).strokeCircle(rival.x, rival.y, 19);
      circle(rival, 7, theme.blue, 2);
    }
    // The halo enlarges visibility, not the physical collision radius.
    g.lineStyle(3, playerColor, 0.8).strokeCircle(
      world.ball.x,
      world.ball.y,
      18,
    );
    circle(world.ball, 7, theme.white, 2);
  }
  dispose() {
    this.g.clearMask();
    this.mask.destroy();
    this.maskShape.destroy();
    this.g.destroy();
    this.frame.destroy();
  }
}
