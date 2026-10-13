export interface Enemy {
  x: number;
  y: number;
  hp: number;
  kind: number;
  alive: boolean;
}
export interface Projectile {
  x: number;
  y: number;
  previousY: number;
  vy: number;
  enemy: boolean;
  active: boolean;
}
export class ShooterWorld {
  player = { x: 210, y: 599 };
  enemies: Enemy[] = [];
  projectiles: Projectile[] = Array.from({ length: 80 }, () => ({
    x: 0,
    y: 0,
    previousY: 0,
    vy: 0,
    enemy: false,
    active: false,
  }));
  score = 0;
  lives = 3;
  wave = 1;
  dead = false;
  invulnerable = 0;
  private direction = 1;
  private shotClock = 0;
  private enemyClock = 1;
  private nextWave = 0;
  private elapsed = 0;
  constructor(private random = Math.random) {
    this.spawnWave();
  }
  spawnWave() {
    this.enemies = [];
    const rows = Math.min(5, 2 + Math.floor(this.wave / 2));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < 6; c++)
        this.enemies.push({
          x: 76 + c * 52,
          y: 165 + r * 41,
          hp: r === 0 && this.wave >= 3 ? 2 : 1,
          kind: r % 3,
          alive: true,
        });
    this.direction = 1;
    this.enemyClock = 1;
    this.projectiles.forEach((p) => (p.active = false));
    this.invulnerable = 1.2;
  }
  private fire(x: number, y: number, enemy: boolean) {
    const p = this.projectiles.find((p) => !p.active);
    if (p)
      Object.assign(p, {
        x,
        y,
        previousY: y,
        vy: enemy ? Math.min(330, 145 + this.wave * 14) : -490,
        enemy,
        active: true,
      });
  }
  step(dt: number, targetX: number, firing: boolean) {
    if (this.dead) return;
    this.elapsed += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.player.x += Math.max(
      -370 * dt,
      Math.min(370 * dt, targetX - this.player.x),
    );
    this.player.x = Math.max(44, Math.min(376, this.player.x));
    this.shotClock -= dt;
    if (firing && this.shotClock <= 0) {
      this.fire(this.player.x, this.player.y - 19, false);
      this.shotClock = 0.23;
    }
    if (this.nextWave > 0) {
      this.nextWave -= dt;
      if (this.nextWave <= 0) {
        this.wave++;
        this.spawnWave();
      }
      return;
    }
    const living = this.enemies.filter((e) => e.alive),
      speed = 20 + this.wave * 5 + (this.enemies.length - living.length) * 0.85;
    if (
      living.some(
        (e) =>
          e.x + this.direction * speed * dt < 43 ||
          e.x + this.direction * speed * dt > 377,
      )
    ) {
      this.direction *= -1;
      living.forEach((e) => (e.y += 12));
    }
    living.forEach((e) => (e.x += this.direction * speed * dt));
    this.enemyClock -= dt;
    if (this.enemyClock <= 0 && living.length) {
      const e =
        living[
          Math.min(living.length - 1, Math.floor(this.random() * living.length))
        ];
      this.fire(e.x, e.y + 14, true);
      this.enemyClock = Math.max(0.24, 1.05 - this.wave * 0.065);
    }
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.previousY = p.y;
      p.y += p.vy * dt;
      if (p.y < 116 || p.y > 646) {
        p.active = false;
        continue;
      }
      if (p.enemy) {
        if (
          this.invulnerable <= 0 &&
          Math.abs(p.x - this.player.x) < 17 &&
          p.y >= this.player.y - 14 &&
          p.previousY <= this.player.y + 14
        ) {
          p.active = false;
          this.hurt();
        }
      } else {
        const target = living.find(
          (e) =>
            e.alive &&
            Math.abs(e.x - p.x) < 17 &&
            p.y <= e.y + 13 &&
            p.previousY >= e.y - 13,
        );
        if (target) {
          p.active = false;
          target.hp--;
          if (target.hp <= 0) {
            target.alive = false;
            this.score += 10 + target.kind * 5;
          }
        }
      }
    }
    if (living.some((e) => e.y > 563)) {
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
  private hurt() {
    if (this.invulnerable > 0) return;
    this.lives--;
    this.invulnerable = 1.5;
    if (this.lives <= 0) this.dead = true;
  }
  get transitioning() {
    return this.nextWave > 0;
  }
}
