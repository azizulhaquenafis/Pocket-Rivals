import {
  POWERUPS,
  ORDINARY_LOOT_INTERVAL,
  canDropLife,
  type Pickup,
  type PowerupKind,
} from "./Powerups";
import { formation, waveSpeed, attackInterval } from "./Waves";
export interface Enemy {
  x: number;
  y: number;
  hp: number;
  kind: number;
  alive: boolean;
  maxHp?: number;
  phase?: number;
  charge?: number;
  drop?: PowerupKind;
  hit?: number;
}
export interface Projectile {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  enemy: boolean;
  active: boolean;
  damage: number;
  pierce: number;
  laser: boolean;
  hits: Enemy[];
}
export interface Burst {
  x: number;
  y: number;
  age: number;
  kind: "hit" | "kill" | "pickup";
}
/** Return the swept segment/box entry time, including diagonal fast shots. */
function contact(p: Projectile, x: number, y: number, rx: number, ry: number) {
  let low = 0,
    high = 1;
  // Avoid allocating axis arrays for every shot/enemy pair at 120 Hz.
  for (let axis = 0; axis < 2; axis++) {
    const start = axis === 0 ? p.previousX : p.previousY,
      delta = (axis === 0 ? p.x : p.y) - start,
      center = axis === 0 ? x : y,
      radius = axis === 0 ? rx : ry;
    if (Math.abs(delta) < 1e-8) {
      if (Math.abs(start - center) > radius) return Infinity;
      continue;
    }
    const a = (center - radius - start) / delta,
      b = (center + radius - start) / delta;
    low = Math.max(low, Math.min(a, b));
    high = Math.min(high, Math.max(a, b));
    if (low > high) return Infinity;
  }
  return low;
}
export class ShooterWorld {
  player = { x: 210, y: 599 };
  enemies: Enemy[] = [];
  projectiles: Projectile[] = Array.from({ length: 80 }, () => ({
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    vx: 0,
    vy: 0,
    enemy: false,
    active: false,
    damage: 1,
    pierce: 1,
    laser: false,
    hits: [],
  }));
  pickups: Pickup[] = Array.from({ length: 8 }, (_, id) => ({
    id,
    x: 0,
    y: 0,
    kind: "spread",
    active: false,
    age: 0,
  }));
  bursts: Burst[] = [];
  score = 0;
  lives = 3;
  wave = 1;
  dead = false;
  invulnerable = 0;
  weaponLevel = 0;
  rapid = 0;
  laser = 0;
  drone = 0;
  shield = false;
  pickupSerial = 0;
  shotSerial = 0;
  kills = 0;
  elapsed = 0;
  announcement = { text: "", remaining: 0, kind: "spread" as PowerupKind };
  private direction = 1;
  private shotClock = 0;
  private enemyClock = 1.1;
  private nextWave = 0;
  private lastLife = -Infinity;
  private dropSerial = 0;
  private shotCount = 0;
  constructor(private random = Math.random) {
    this.spawnWave();
  }
  spawnWave() {
    this.enemies = formation(this.wave);
    this.direction = this.wave % 2 ? 1 : -1;
    this.enemyClock = 1.1;
    this.projectiles.forEach((p) => {
      p.active = false;
      p.hits.length = 0;
    });
    this.invulnerable = Math.max(this.invulnerable, 1.2);
  }
  get speed() {
    let killed = 0;
    for (const e of this.enemies) if (!e.alive) killed++;
    return waveSpeed(this.wave, killed);
  }
  get weaponName() {
    return this.laser > 0
      ? "PIERCING LASER"
      : ["BLASTER", "TWIN CANNON", "TRIPLE CANNON", "FIVE CANNON"][
          this.weaponLevel
        ];
  }
  private fire(x: number, y: number, enemy: boolean, vx = 0, vy?: number) {
    // Separate reservations prevent rapid/spread fire from suppressing enemy attacks.
    const start = enemy ? 52 : 0,
      end = enemy ? 80 : 52;
    let p: Projectile | undefined;
    for (let i = start; i < end; i++)
      if (!this.projectiles[i].active) {
        p = this.projectiles[i];
        break;
      }
    if (!p) return;
    Object.assign(p, {
      x,
      y,
      previousX: x,
      previousY: y,
      vx,
      vy: vy ?? (enemy ? Math.min(340, 155 + this.wave * 13) : -490),
      enemy,
      active: true,
      damage: !enemy && this.laser > 0 ? 2 : 1,
      pierce: !enemy && this.laser > 0 ? 3 : 1,
      laser: !enemy && this.laser > 0,
    });
    p.hits.length = 0;
  }
  private shoot() {
    const x = this.player.x,
      y = this.player.y - 19;
    this.fire(this.weaponLevel === 1 ? x - 7 : x, y, false);
    if (this.weaponLevel === 1) this.fire(x + 7, y, false);
    if (this.weaponLevel >= 2) {
      this.fire(x - 8, y + 3, false, -80);
      this.fire(x + 8, y + 3, false, 80);
    }
    if (this.weaponLevel >= 3) {
      this.fire(x - 13, y + 6, false, -145);
      this.fire(x + 13, y + 6, false, 145);
    }
    if (this.drone > 0 && this.shotCount++ % 2 === 0) {
      this.fire(Math.max(37, x - 29), y + 10, false);
      this.fire(Math.min(383, x + 29), y + 10, false);
    }
    this.shotSerial++;
  }
  private attack(e: Enemy) {
    const speed = Math.min(340, 155 + this.wave * 13);
    if (e.kind === 3 || e.kind === 5) {
      const dx = this.player.x - e.x,
        dy = this.player.y - e.y;
      const vx = Math.max(
        -speed * 0.6,
        Math.min(speed * 0.6, (dx / Math.hypot(dx, dy)) * speed),
      );
      this.fire(e.x, e.y + 15, true, vx, Math.sqrt(speed * speed - vx * vx));
      if (e.kind === 5)
        for (const offset of [-65, 65])
          this.fire(e.x, e.y + 15, true, vx + offset, speed * 0.88);
    } else if (e.kind === 1 && this.wave >= 2)
      for (const vx of [-55, 55]) this.fire(e.x, e.y + 14, true, vx);
    else this.fire(e.x, e.y + 14, true);
  }
  private drop(e: Enemy) {
    let kind = e.drop;
    if (
      e.kind === 4 &&
      canDropLife(this.wave, this.elapsed, this.lastLife, this.lives)
    )
      kind = "life";
    if (!kind && this.kills % ORDINARY_LOOT_INTERVAL === 0) {
      const choices: PowerupKind[] = [
        "spread",
        "rapid",
        "shield",
        "drone",
        "laser",
      ];
      kind = choices[Math.min(4, Math.floor(this.random() * 5))];
    }
    if (!kind) return;
    if (kind === "life") this.lastLife = this.elapsed;
    const p =
      this.pickups.find((p) => !p.active) ??
      this.pickups
        .filter((p) => p.kind !== "life")
        .sort((a, b) => b.age - a.age)[0];
    if (p)
      Object.assign(p, {
        id: this.dropSerial++,
        kind,
        x: e.x,
        y: e.y,
        age: 0,
        active: true,
      });
  }
  private collect(p: Pickup) {
    p.active = false;
    this.pickupSerial++;
    const kind = p.kind === "life" && this.lives >= 4 ? "shield" : p.kind;
    if (kind === "spread") this.weaponLevel = Math.min(3, this.weaponLevel + 1);
    else if (kind === "shield") this.shield = true;
    else if (kind === "life") this.lives++;
    else this[kind] = Math.min(24, this[kind] + POWERUPS[kind].duration);
    this.announcement = {
      text:
        kind === "spread"
          ? this.weaponName
          : kind === "life" && this.lives === 4
            ? "+1 LIFE"
            : POWERUPS[kind].name,
      kind,
      remaining: 1.5,
    };
    this.effect(p.x, p.y, "pickup");
  }
  private effect(x: number, y: number, kind: Burst["kind"]) {
    if (this.bursts.length >= 24) this.bursts.shift();
    this.bursts.push({ x, y, kind, age: 0 });
  }
  private hurt() {
    if (this.invulnerable > 0) return;
    if (this.shield) {
      this.shield = false;
      this.invulnerable = 0.8;
      this.effect(this.player.x, this.player.y, "pickup");
      return;
    }
    this.lives--;
    this.weaponLevel = Math.max(0, this.weaponLevel - 1);
    this.invulnerable = 1.5;
    this.effect(this.player.x, this.player.y, "hit");
    if (this.lives <= 0) {
      this.dead = true;
      this.projectiles.forEach((p) => (p.active = false));
    }
  }
  step(dt: number, targetX: number, firing: boolean) {
    if (this.dead) return;
    this.elapsed += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    for (const name of ["rapid", "laser", "drone"] as const)
      this[name] = Math.max(0, this[name] - dt);
    this.announcement.remaining = Math.max(0, this.announcement.remaining - dt);
    for (const b of this.bursts) b.age += dt;
    this.bursts = this.bursts.filter((b) => b.age < 0.45);
    this.player.x = Math.max(
      44,
      Math.min(
        376,
        this.player.x +
          Math.max(-370 * dt, Math.min(370 * dt, targetX - this.player.x)),
      ),
    );
    for (const p of this.pickups)
      if (p.active) {
        p.age += dt;
        p.y += 86 * dt;
        if (p.y > 450 && Math.abs(p.x - this.player.x) < 85)
          p.x += Math.max(-110 * dt, Math.min(110 * dt, this.player.x - p.x));
        if (
          Math.abs(p.x - this.player.x) < 24 &&
          Math.abs(p.y - this.player.y) < 25
        )
          this.collect(p);
        else if (p.y > 640 || p.age > 9) p.active = false;
      }
    this.shotClock -= dt;
    if (firing && this.shotClock <= 0 && !this.transitioning) {
      this.shoot();
      this.shotClock = this.rapid > 0 ? 0.11 : 0.23;
    }
    if (this.nextWave > 0) {
      this.nextWave -= dt;
      if (this.nextWave <= 0) {
        this.wave++;
        // Equipment belongs to this level. Health and rare life capsules belong to the run.
        this.weaponLevel = 0;
        this.rapid = this.laser = this.drone = 0;
        this.shield = false;
        this.announcement.remaining = 0;
        this.shotClock = this.shotCount = 0;
        for (const p of this.pickups) if (p.kind !== "life") p.active = false;
        this.spawnWave();
      }
      return;
    }
    const living = this.enemies.filter((e) => e.alive),
      speed = this.speed;
    if (
      living.some(
        (e) =>
          e.x + this.direction * speed * dt < 43 ||
          e.x + this.direction * speed * dt > 377,
      )
    ) {
      this.direction *= -1;
      for (const e of living) e.y += 10;
    }
    for (const e of living) {
      const sway =
        e.kind === 1
          ? Math.sin(this.elapsed * 2 + (e.phase ?? 0)) -
            Math.sin((this.elapsed - dt) * 2 + (e.phase ?? 0))
          : 0;
      e.x = Math.max(
        42,
        Math.min(378, e.x + this.direction * speed * dt + sway * 9),
      );
      e.y += Math.min(1.2, 0.25 + this.wave * 0.06) * dt;
      e.hit = Math.max(0, (e.hit ?? 0) - dt);
      if ((e.charge ?? 0) > 0) {
        e.charge = Math.max(0, e.charge! - dt);
        if (e.charge === 0) this.attack(e);
      }
    }
    this.enemyClock -= dt;
    if (this.enemyClock <= 0 && living.length) {
      const front = living.filter(
        (e) =>
          !living.some(
            (other) => other.y > e.y + 15 && Math.abs(other.x - e.x) < 22,
          ),
      );
      const e =
        front[
          Math.min(front.length - 1, Math.floor(this.random() * front.length))
        ];
      if (e && !e.charge) e.charge = e.kind === 5 ? 0.55 : 0.38;
      this.enemyClock = attackInterval(this.wave);
    }
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.previousX = p.x;
      p.previousY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.enemy) {
        if (
          this.invulnerable <= 0 &&
          contact(p, this.player.x, this.player.y, 17, 14) !== Infinity
        ) {
          p.active = false;
          this.hurt();
        }
      } else {
        for (let hit = 0; hit < 3 && p.active; hit++) {
          let target: Enemy | undefined,
            nearest = Infinity;
          for (const e of living)
            if (e.alive && !p.hits.includes(e)) {
              const t = contact(
                p,
                e.x,
                e.y,
                e.kind === 5 ? 25 : 17,
                e.kind === 5 ? 17 : 13,
              );
              if (t < nearest) {
                nearest = t;
                target = e;
              }
            }
          if (!target) break;
          p.hits.push(target);
          p.pierce--;
          if (p.pierce <= 0) p.active = false;
          target.hp -= p.damage;
          target.hit = 0.09;
          this.effect(target.x, target.y, "hit");
          if (target.hp <= 0) {
            target.alive = false;
            this.kills++;
            this.score += 10 + target.kind * 5;
            this.drop(target);
            this.effect(target.x, target.y, "kill");
          }
        }
      }
      if (p.x < 26 || p.x > 394 || p.y < 116 || p.y > 646) p.active = false;
      if (this.dead) return;
    }
    if (living.some((e) => e.alive && e.y > 563)) {
      this.hurt();
      if (!this.dead) {
        this.spawnWave();
        this.player.x = 210;
      }
    } else if (!this.enemies.some((e) => e.alive)) {
      this.score += this.wave * 50;
      this.nextWave = 1.15;
      this.projectiles.forEach((p) => (p.active = false));
    }
  }
  get transitioning() {
    return this.nextWave > 0;
  }
}
