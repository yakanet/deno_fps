import { UI } from "./console.ts";

const rawMap = `|################
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..........#####
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |#..............#
                |################`
  .split("|")
  .map((line) => line.trim())
  .join("");

const screen: Size = { width: 120, height: 40 };
const map: Size = { width: 16, height: 16 };
const player: Player = { x: 8.0, y: 8.0, angle: 0.0 };

const buffer: string[] = new Array(screen.width * screen.height);
const depth = 16.0;
const fov = Math.PI / 4.0;
// @ts-ignore
const ui = UI.of(window.document ? 'browser': 'console');
const clock = {
  start: performance.now(),
  end: performance.now(),
};
const speed = {front: 2.0,side: 0.5};

async function tick() {
  ui.clear();
  clock.end = performance.now();
  const elapsed = (clock.end - clock.start) / 1000;
  clock.start = clock.end;
  
  if (ui.isKeyPressed("q")) {
    player.angle -= speed.side * elapsed;
  }
  if (ui.isKeyPressed("d")) {
    player.angle += speed.side * elapsed;
  }
  if (ui.isKeyPressed("z")) {
    player.x =  player.x + Math.sin(player.angle) * speed.front * elapsed;
    player.y =  player.y + Math.cos(player.angle) * speed.front * elapsed;
  }
  if (ui.isKeyPressed("s")) {
    player.x = player.x - Math.sin(player.angle) * speed.front * elapsed;
    player.y = player.y - Math.cos(player.angle) * speed.front * elapsed;
  }
  for (let x = 0; x < screen.width; x++) {
    const rayAngle = player.angle - fov / 2.0 + (x / screen.width) * fov;
    let distanceToWall = 0.0;
    let hitWall = false;
    let hitBoundry = false;

    const eye = { x: Math.sin(rayAngle), y: Math.cos(rayAngle) };
    while (!hitWall && distanceToWall < depth) {
      distanceToWall += 0.1;
      const test: Point = {
        x: Math.floor(player.x + eye.x * distanceToWall),
        y: Math.floor(player.y + eye.y * distanceToWall),
      };
      if (
        num(test.x).outside(0, map.width) ||
        num(test.y).outside(0, map.height)
      ) {
        hitWall = true;
        distanceToWall = depth;
      } else {
        if (rawMap[test.y * map.width + test.x] === "#") {
          hitWall = true;
          const p: Array<[number, number]> = [];
          for (let tx = 0; tx < 2; tx++) {
            for (let ty = 0; ty < 2; ty++) {
              const vy = test.y + ty - player.y;
              const vx = test.x + tx - player.x;
              const d = Math.sqrt(vx * vx + vy * vy);
              const dot = (eye.x * vx) / d + (eye.y * vy) / d;
              p.push([d, dot]);
            }
          }
          // Sort pairs from closest to farthest
          p.sort(([distance1], [distance2]) => distance2 - distance1);
          const bound = 0.01;
          if (Math.acos(p[0][1]) < bound) hitBoundry = true;
          if (Math.acos(p[1][1]) < bound) hitBoundry = true;
          //if(Math.acos(p[2][1]) < bound) hitBoundry = true;
        }
      }
    }
    const ceiling = screen.height / 2.0 - screen.height / distanceToWall;
    const floor = screen.height - ceiling;
    let shade = " ";
    if (distanceToWall <= depth / 4.0) shade = "█";
    else if (distanceToWall <= depth / 3.0) shade = "▓";
    else if (distanceToWall <= depth / 2.0) shade = "▒";
    else if (distanceToWall <= depth / 1.0) shade = "░";
    else shade = " ";

    //░▒▓█
    if (hitBoundry) {
      shade = " ";
    }
    for (let y = 0; y < screen.height; y++) {
      if (y < ceiling) {
        buffer[y * screen.width + x] = " ";
      } else if (y > ceiling && y <= floor) {
        buffer[y * screen.width + x] = shade;
      } else {
        const b = 1.0 - (y - screen.height / 2) / (screen.height / 2);
        if (b < 0.25) shade = "#";
        else if (b < 0.5) shade = "x";
        else if (b < 0.75) shade = ".";
        else if (b < 0.9) shade = "-";
        else shade = " ";
        buffer[y * screen.width + x] = shade;
      }
    }
  }

  // Display map
  for (let nx = 0; nx < map.width; nx++) {
    for (let ny = 0; ny < map.height; ny++) {
      buffer[(ny + 1) * screen.width + nx + 1] = rawMap[ny * map.width + nx];
    }
  }
  buffer[Math.trunc(player.y + 1) * screen.width + Math.trunc(player.x + 1)] = "P";

  // Add line break to have screen.width line length
  for (let i = 0; i < screen.height; i++) {
    buffer[screen.width * i] = "\n";
  }
  //buffer[Math.floor(player.y + 1) * screen.width + Math.floor(player.x)] = char('P');
  ui.output(
    `X=${player.x}, Y=${player.y}, A=${player.angle}, Key=${ui.key}, FPS=${1 / elapsed}\n` +
    buffer.join("")
  );
}
ui.loop(async () => await tick());

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Player extends Point {
  angle: number;
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