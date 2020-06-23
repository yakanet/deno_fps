const { PI, trunc, sin, cos, sqrt, acos, round } = Math;
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
    const mapLines = rawMap.trim().split("|").filter(line => !!line.trim());
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
     |#......##......#
     |#..............#
     |#..............#
     |#..............#
     |################`
  ),
  playerX: 8,
  playerY: 8,
  depth: 16.0,
  fov: PI / 4.0,
};

export class Game {
  private keyPressed = new Set<string>();
  private rawMap: string;
  private rawMapSize: { width: number; height: number };
  private player: { x: number; y: number; angle: number };
  private buffer: string[];
  private depth: number;
  private fov: number;
  private speed = { front: 2.0, side: 0.5 } as const;

  constructor(
    private width: number,
    private height: number,
    options = defaultOptions
  ) {
    this.initializeKeyboardListener();
    this.buffer = new Array<string>(width * height);
    this.depth = options.depth;
    this.fov = options.fov;
    this.rawMap = options.map.rawMap;
    this.rawMapSize = { width: options.map.width, height: options.map.height };
    this.player = { x: options.playerX, y: options.playerY, angle: 0.0 };
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
    const { player, width, height, keyPressed, buffer } = this;

    // Clear the screen
    console.clear();

    // Check elapsed time
    clock.end = performance.now();
    const elapsed = (clock.end - clock.start) / 1000;
    clock.start = clock.end;

    // Keyboard management
    this.movePlayer(this.keyPressed, elapsed);

    // Render wall accordint to the player position
    this.renderWalls();

    // Add line break to have screen.width line length
    for (let i = 0; i < height; i++) {
      buffer[width * i] = LINE_BREAK;
    }

    // Add minimap
    this.renderMiniMap();

    // Display this rendering in the console
    console.log(
      `X=${player.x}, Y=${player.y}, A=${toDegree(player.angle)}, Key=${[
        ...keyPressed,
      ].join("")}, FPS=${1 / elapsed}`.padEnd(width, " ") +
        LINE_BREAK +
        buffer.join("")
    );

    // Loop
    window.requestAnimationFrame(async () => await this.tick());
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

  private renderWalls() {
    const {
      rawMap,
      width,
      height,
      player,
      fov,
      depth,
      rawMapSize: map,
      buffer,
    } = this;
    for (let x = 0; x < width; x++) {
      const rayAngle = player.angle - fov / 2.0 + (x / width) * fov;
      let distanceToWall = 0.0;
      let hitWall = false;
      let hitBoundry = false;

      const eye = { x: sin(rayAngle), y: cos(rayAngle) };
      while (!hitWall && distanceToWall < depth) {
        distanceToWall += 0.1;
        const test = {
          x: Math.floor(player.x + eye.x * distanceToWall),
          y: Math.floor(player.y + eye.y * distanceToWall),
        } as const;
        if (
          num(test.x).outside(0, map.width) ||
          num(test.y).outside(0, map.height)
        ) {
          hitWall = true;
          distanceToWall = depth;
        } else {
          if (rawMap[test.y * map.width + test.x] === "#") {
            hitWall = true;
            const p: { distance: number; dot: number }[] = [];
            for (let tx = 0; tx < 2; tx++) {
              for (let ty = 0; ty < 2; ty++) {
                const vy = test.y + ty - player.y;
                const vx = test.x + tx - player.x;
                const d = sqrt(vx * vx + vy * vy);
                const dot = (eye.x * vx) / d + (eye.y * vy) / d;
                p.push({ distance: d, dot });
              }
            }
            // Sort pairs from closest to farthest
            p.sort(
              ({ distance: distance1 }, { distance: distance2 }) =>
                distance1 - distance2
            );
            const bound = 0.005;
            if (acos(p[0].dot) < bound) hitBoundry = true;
            if (acos(p[1].dot) < bound) hitBoundry = true;
            //if (acos(p[2].dot) < bound) hitBoundry = true;
          }
        }
      }

      const ceiling = height / 2.0 - height / distanceToWall;
      const floor = height - ceiling;
      let shade = " ";
      if (hitBoundry) shade = " ";
      else if (distanceToWall <= depth / 4.0) shade = "█";
      else if (distanceToWall <= depth / 3.0) shade = "▓";
      else if (distanceToWall <= depth / 2.0) shade = "▒";
      else if (distanceToWall <= depth / 1.0) shade = "░";
      else shade = " ";

      // Render in buffer
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

  private renderMiniMap() {
    const {
      rawMap,
      width,
      height,
      player,
      fov,
      depth,
      rawMapSize: map,
      buffer,
    } = this;

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
  if (degree < 0) {
    return degree + 360;
  }
  return degree;
}

function num(value: number) {
  return {
    between: (start: number, end: number) => {
      return value >= start && value < end;
    },
    outside: (start: number, end: number) => {
      return value < start || value >= end;
    },
  };
}
