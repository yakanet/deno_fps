/// <reference path="./global.d.ts" />

const { PI, trunc, sin, cos, round } = Math;
const LINE_BREAK = "\n" as const;
const clock = {
  start: performance.now(),
  end: performance.now(),
};

export class RawMap {
  public readonly rawMap: string;
  public readonly width: number;
  public readonly height: number;

  constructor(rawMap: string) {
    const mapLines = rawMap
      .trim()
      .split("|")
      .filter((line) => !!line.trim());
    this.height = mapLines.length;
    this.width = Math.min(...mapLines.map((x) => x.length));
    this.rawMap = mapLines.map((line) => line.trim()).join("");
  }
}

const defaultOptions = {
  map: new RawMap(
    `|################
     |#.......#......#
     |#..............#
     |#..............#
     |#..............#
     |#####..........#
     |#..............#
     |#..............#
     |#..........#####
     |#..............#
     |#..............#
     |#......#.......#
     |#.......#......#
     |#..............#
     |#..............#
     |################`
  ),
  playerX: 8,
  playerY: 8,
  renderDistance: 16,
  fov: PI / 4,
  useBreakLine: true,
};

export class Game {
  private keyPressed = new Set<string>();
  private rawMap: string;
  private rawMapSize: { width: number; height: number };
  private player: { x: number; y: number; angle: number };
  private buffer: string[];
  private renderDistance: number;
  private fov: number;
  private speed = { front: 2.0, side: 1.0 } as const;
  private useBreakLine: boolean;

  constructor(
    private width: number,
    private height: number,
    partialOptions: Partial<typeof defaultOptions> = defaultOptions
  ) {
    const opts = Object.assign(
      {},
      defaultOptions,
      partialOptions
    ) as typeof defaultOptions;
    this.initializeKeyboardListener();
    this.buffer = new Array<string>(width * height);
    this.renderDistance = opts.renderDistance;
    this.fov = opts.fov;
    this.rawMap = opts.map.rawMap;
    this.rawMapSize = { width: opts.map.width, height: opts.map.height };
    this.player = { x: opts.playerX, y: opts.playerY, angle: 0.0 };
    this.useBreakLine = opts.useBreakLine;
  }

  /**
   * Store in {keypressed} what keys had been pressed
   */
  private initializeKeyboardListener() {
    addEventListener("keydown", (ev: any) => {
      this.keyPressed.add(ev.key);
    });
    addEventListener("keyup", (ev: any) => {
      this.keyPressed.delete(ev.key);
    });
  }

  public tick() {
    // Clear the screen
    console.clear();

    // Check elapsed time
    clock.end = performance.now();
    const elapsed = (clock.end - clock.start) / 1000;
    clock.start = clock.end;

    // Keyboard management
    this.movePlayer(this.keyPressed, elapsed);

    // Render wall accordint to the player position
    this.processWorld();

    // Print in the console the buffer
    this.render(elapsed);

    // Loop
    window.requestAnimationFrame(() => this.tick());
  }

  /**
   * Move the player according to the key pressed
   * @param keyPressed List of key pressed
   * @param elapsed time spend between 2 refresh (for more accurate move)
   */
  private movePlayer(keyPressed: Set<string>, elapsed: number) {
    const { player, speed } = this;
    if (keyPressed.has("q")) {
      player.angle -= speed.side * elapsed;
    }
    if (keyPressed.has("d")) {
      player.angle += speed.side * elapsed;
    }
    if (keyPressed.has("z")) {
      player.x = player.x + sin(player.angle) * speed.front * elapsed;
      player.y = player.y + cos(player.angle) * speed.front * elapsed;
    }
    if (keyPressed.has("s")) {
      player.x = player.x - sin(player.angle) * speed.front * elapsed;
      player.y = player.y - cos(player.angle) * speed.front * elapsed;
    }
  }

  /**
   * Calculate wall distances, floor and ceiling positions
   */
  private processWorld() {
    const { rawMap, width, height, rawMapSize: map } = this;
    const { fov, renderDistance, player, buffer } = this;
    for (let x = 0; x < width; x++) {
      const rayAngle = player.angle - fov / 2.0 + (x / width) * fov;
      let distanceToWall = 0.0;
      let hitWall = false;

      const eye = { x: sin(rayAngle), y: cos(rayAngle) };
      // Where is the wall
      while (!hitWall) {
        distanceToWall += 0.1;
        const test = {
          x: round(player.x + eye.x * distanceToWall),
          y: round(player.y + eye.y * distanceToWall),
        } as const;
        const outOfBoundX = isOutside(test.x, 0, map.width);
        const outOfBoundY = isOutside(test.y, 0, map.height);
        if (outOfBoundX || outOfBoundY) {
          hitWall = true;
          distanceToWall = renderDistance;
        } else if (rawMap[test.y * map.width + test.x] === "#") {
          hitWall = true;
        }
      }

      const ceiling = height / 2.0 - height / distanceToWall;
      const floor = height - ceiling;
      let shade = " ";
      if (distanceToWall <= renderDistance / 4) shade = "█";
      else if (distanceToWall <= renderDistance / 3) shade = "▓";
      else if (distanceToWall <= renderDistance / 2) shade = "▒";
      else if (distanceToWall <= renderDistance / 1) shade = "░";
      else shade = " ";

      // Render floor & ceiling
      for (let y = 0; y < height; y++) {
        if (y < ceiling) {
          buffer[y * width + x] = " ";
        } else if (y > ceiling && y <= floor) {
          buffer[y * width + x] = shade;
        } else {
          const b = 1.0 - (y - height / 2) / (height / 2);
          if (b < 0.25) shade = "#";
          else if (b < 0.5) shade = "x";
          else if (b < 0.75) shade = ".";
          else if (b < 0.9) shade = "-";
          else shade = " ";
          buffer[y * width + x] = shade;
        }
      }
    }
  }

  /**
   * Output the content of the buffer
   * @param elapsed Time spend between 2 frames
   */
  private render(elapsed: number) {
    const { player, width, height, keyPressed, buffer } = this;

    if (this.useBreakLine) {
      for (let i = 0; i < height; i++) {
        buffer[width * i] = LINE_BREAK;
      }
    }

    // Add minimap
    this.renderMiniMap();

    // Display this rendering in the console
    const pressed = [...keyPressed].join("");
    const angle = toDegree(player.angle);
    const fps = 1 / elapsed;
    console.log(
      [
        [
          `X=${player.x}`,
          `Y=${player.y}`,
          `A=${angle}`,
          `Key=${pressed}`,
          `FPS=${fps}`,
        ]
          .join(", ")
          .padEnd(width, " "),
        buffer.join(""),
      ].join(this.useBreakLine ? LINE_BREAK : "")
    );
  }

  /**
   * Display a simple mini-map on le top left corner
   */
  private renderMiniMap() {
    const { rawMap, width, player, rawMapSize: map, buffer } = this;

    // Display map
    for (let nx = 0; nx < map.width; nx++) {
      for (let ny = 0; ny < map.height; ny++) {
        buffer[(ny + 1) * width + nx + 1] = rawMap[ny * map.width + nx];
      }
    }
    buffer[trunc(player.y + 1) * width + trunc(player.x + 1)] = getPlayerIcon(
      player.angle
    );
  }
}

function getPlayerIcon(a: number) {
  const icons = "↓↘→↗↑↖←↙↓";
  return icons[round(toDegree(a) / 45)];
}

function toDegree(radian: number) {
  const degree = ((radian * 180) / PI) % 360;
  return degree < 0 ? degree + 360 : degree;
}

function isOutside(value: number, start: number, end: number) {
  return value < start || value >= end;
}
