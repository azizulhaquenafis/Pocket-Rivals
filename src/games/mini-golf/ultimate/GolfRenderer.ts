import type Phaser from "phaser";
import { theme } from "../../../core/ThemeManager";
import { GolfView } from "./GolfInput";
import { GolfPhysics } from "./GolfPhysics";
import type { Point, Rect } from "./courses";
import { difficulties } from "./GolfRules";
import {
  drawBumper,
  drawCourseBackdrop,
  drawField,
  drawFlagAndCup,
  drawFoundryOil,
  drawLaser,
  drawLava,
  drawMoverTrackAndBody,
  drawPlank,
  drawPortal,
  drawRiver,
  drawSurface,
  drawTempleCircuit,
  drawTidalBridge,
  drawWall,
} from "./components/CourseDecor";

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

    // 1. Full-bleed themed backdrop, boundary filler scenery & seamless islands/walkways
    drawCourseBackdrop(g, c, d.time, this.view.portrait);
    drawTempleCircuit(g, c, d);

    // 2. River, tidal bridges & crumbling temple planks
    if (c.river) drawRiver(g, c.river, d.time);
    c.bridges?.forEach((r) => drawTidalBridge(g, r, d));
    c.planks?.forEach((row, b) =>
      row.forEach((r, i) =>
        drawPlank(g, r, d.planks[b * 5 + i], [0.5, 0.2][b]),
      ),
    );

    // 3. Tee pad marker at start
    g.fillStyle(0xfffdf5, 0.72).fillCircle(c.start.x, c.start.y, 17);
    g.lineStyle(2.5, theme.ink, 0.55).strokeCircle(c.start.x, c.start.y, 17);

    // 4. Surfaces & Foundry oil puddle
    c.surfaces.forEach((r) => drawSurface(g, r, c.id, d.time));
    if (c.id === "foundry") drawFoundryOil(g);

    // 5. Magnetic / whirlpool / gravity fields & molten lava
    c.fields.forEach((f) => drawField(g, f, c.id, d.time));
    c.lava?.forEach((v) => drawLava(g, v, d.time));

    // 6. Bumpers & walls
    c.circles.forEach((v) => drawBumper(g, v, c.id));
    c.walls.forEach((r) => drawWall(g, r, c.id));

    // 7. Diamond deflector
    if (c.diamond) {
      g.save();
      g.translateCanvas(c.diamond.x, c.diamond.y);
      g.rotateCanvas(Math.PI / 4);
      const side = c.diamond.r * Math.SQRT2;
      rect({ x: -side / 2, y: -side / 2, w: side, h: side }, theme.orange, 4);
      rect(
        { x: -side * 0.28, y: -side * 0.28, w: side * 0.56, h: side * 0.56 },
        0xffdc94,
        2,
      );
      g.restore();
    }

    // 8. Moving obstacles (with recessed tracks), spinning fans & hydraulic piston
    drawMoverTrackAndBody(g, c, d);
    c.fans.forEach((f) => {
      g.lineStyle(2, theme.ink, 0.14).strokeCircle(f.x, f.y, f.length / 2);
      g.save();
      g.translateCanvas(f.x, f.y);
      g.rotateCanvas((d.time * f.spin * Math.PI) / 180);
      rect({ x: -f.length / 2, y: -6, w: f.length, h: 12 }, theme.orange, 3);
      rect({ x: -6, y: -f.length / 2, w: 12, h: f.length }, theme.orange, 3);
      g.restore();
      circle(f, f.hub, 0x454e58, 3);
      circle(f, f.hub * 0.42, 0xf2c057, 0);
    });
    const piston = d.piston();
    if (piston) {
      // Hydraulic steel shaft + hazard-striped pusher head
      g.fillStyle(0x6d7a84).fillRect(piston.x, piston.y + 16, piston.w, piston.h - 32);
      g.lineStyle(3, theme.ink).strokeRect(piston.x, piston.y + 16, piston.w, piston.h - 32);
      const headX = piston.x + piston.w - 28;
      rect({ x: headX, y: piston.y, w: 28, h: piston.h }, theme.orange, 4);
      g.fillStyle(theme.ink, 0.65).fillRect(headX + 10, piston.y + 6, 8, piston.h - 12);
    }

    // 9. Lasers / dart traps, runic plates & doors
    c.lasers.forEach((r, i) => drawLaser(g, r, i, c.id, d));
    c.plates?.forEach((p, i) => {
      const active = i === 0 ? d.gate > 0 : d.plates[i];
      circle(p, 26, active ? theme.blue : 0xf1d583, 4);
      if (i === 0 && d.gate > 0) {
        g.lineStyle(4.5, 0xfffdf5, 0.9);
        g.beginPath();
        g.arc(
          p.x,
          p.y,
          31,
          -Math.PI / 2,
          -Math.PI / 2 + (d.gate / 6) * Math.PI * 2,
          false,
        );
        g.strokePath();
      }
      circle(p, 12, 0xfffdf5, 2.5);
      circle(p, 5, active ? theme.blue : 0xc79238, 0);
    });
    c.doors?.forEach((_, i) => {
      const door = d.door(i);
      const unlocked = d.doors[i] > 0.95;
      rect(door, unlocked ? theme.blue : 0xe3944c, 4.5);
      g.fillStyle(unlocked ? 0xdcf7ff : 0xffe2a8, 0.8).fillRect(
        door.x + 8,
        door.y + 14,
        door.w - 16,
        door.h - 28,
      );
    });

    // 10. Paired warp portals & UFO
    c.portals?.forEach((p, i) => drawPortal(g, p, i, d.time));
    const u = d.ufo;
    if (u.active) {
      if (u.carry > 0 || u.hover > 0) {
        g.fillStyle(0x6ae8e0, 0.28).fillCircle(u.x, u.y, 80);
        g.lineStyle(3, 0x9ef7f0, 0.65).strokeCircle(u.x, u.y, 76);
      }
      g.fillStyle(0x52a8d8).fillEllipse(u.x, u.y, 94, 38);
      g.lineStyle(4, theme.ink).strokeEllipse(u.x, u.y, 94, 38);
      // Blinking saucer rim lights
      for (let k = -2; k <= 2; k++) {
        const lit = Math.floor(d.time * 6 + k) % 2 === 0;
        g.fillStyle(lit ? 0xffe680 : 0x8ef2ff).fillCircle(
          u.x + k * 16,
          u.y + 5,
          3.5,
        );
      }
      circle({ x: u.x, y: u.y - 3 }, 19, 0xe8fbff, 3);
    }

    // 11. Upright cup & fluttering flag
    drawFlagAndCup(g, c.hole, this.view.portrait, d.time);

    // 12. Aiming pullback & outlined trajectory preview dots
    if (aim && world.shootable) {
      const b = world.ball,
        speed = Math.hypot(aim.x, aim.y),
        preview = difficulties[world.difficulty].preview;
      g.lineStyle(5, theme.white, 0.55).lineBetween(
        b.x,
        b.y,
        b.x - aim.x / 3.125,
        b.y - aim.y / 3.125,
      );
      g.lineStyle(3, theme.ink, 0.8).lineBetween(
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
        this.previewPoints.forEach((p, i) => {
          const a = 1 - i / (this.previewPoints.length + 4);
          g.fillStyle(theme.ink, a * 0.75).fillCircle(p.x, p.y, 6);
          g.fillStyle(theme.white, a).fillCircle(p.x, p.y, 4);
        });
      } else if (preview && speed) {
        const len = speed * preview - 55 * preview * preview;
        for (let i = 1; i <= 12; i++) {
          const a = 1 - i / 15;
          const px = b.x + ((aim.x / speed) * len * i) / 12;
          const py = b.y + ((aim.y / speed) * len * i) / 12;
          g.fillStyle(theme.ink, a * 0.7).fillCircle(px, py, 6);
          g.fillStyle(theme.white, a).fillCircle(px, py, 4);
        }
      }
    }

    // 13. Rival & player ball with crisp visibility halo
    if (rival) {
      g.lineStyle(3, theme.blue, 0.85).strokeCircle(rival.x, rival.y, 19);
      circle(rival, 7, theme.blue, 2);
    }
    // The halo enlarges visibility, not the physical collision radius.
    g.lineStyle(3.5, playerColor, 0.88).strokeCircle(
      world.ball.x,
      world.ball.y,
      18,
    );
    circle(world.ball, 7.5, theme.white, 2.5);
  }
  dispose() {
    this.g.clearMask();
    this.mask.destroy();
    this.maskShape.destroy();
    this.g.destroy();
    this.frame.destroy();
  }
}
