import { isBrowser } from './console-polyfill.ts';

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

const screen = { width: 120, height: 40 } as const;
const map = { width: 16, height: 16 } as const;
const speed = { front: 2.0, side: 0.5 } as const;

const buffer = new Array<string>(screen.width * screen.height);
const depth = 16.0;
const fov = Math.PI / 4.0;
const clock = {
  start: performance.now(),
  end: performance.now(),
};
const player = { x: 8.0, y: 8.0, angle: 0.0 };

const keyPressed = new Set<string>();
addEventListener("keydown", (ev: any) => { keyPressed.add(ev.key); });
addEventListener("keyup",  (ev: any) => { keyPressed.delete(ev.key); });

async function tick() {
  console.clear();
  clock.end = performance.now();
  const elapsed = (clock.end - clock.start) / 1000;
  clock.start = clock.end;

  // Keyboard management
  if (keyPressed.has("q")) {
    player.angle -= speed.side * elapsed;
  }
  if (keyPressed.has("d")) {
    player.angle += speed.side * elapsed;
  }
  if (keyPressed.has("z")) {
    player.x = player.x + Math.sin(player.angle) * speed.front * elapsed;
    player.y = player.y + Math.cos(player.angle) * speed.front * elapsed;
  }
  if (keyPressed.has("s")) {
    player.x = player.x - Math.sin(player.angle) * speed.front * elapsed;
    player.y = player.y - Math.cos(player.angle) * speed.front * elapsed;
  }

  // Walls
  for (let x = 0; x < screen.width; x++) {
    const rayAngle = player.angle - fov / 2.0 + (x / screen.width) * fov;
    let distanceToWall = 0.0;
    let hitWall = false;
    let hitBoundry = false;

    const eye = { x: Math.sin(rayAngle), y: Math.cos(rayAngle) };
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
          const p: {distance: number, dot: number}[] = [];
          for (let tx = 0; tx < 2; tx++) {
            for (let ty = 0; ty < 2; ty++) {
              const vy = test.y + ty - player.y;
              const vx = test.x + tx - player.x;
              const d = Math.sqrt(vx * vx + vy * vy);
              const dot = (eye.x * vx) / d + (eye.y * vy) / d;
              p.push({distance: d, dot});
            }
          }
          // Sort pairs from closest to farthest
          p.sort(({distance: distance1}, {distance: distance2}) => distance2 - distance1);
          const bound = 0.01;
          if (Math.acos(p[0].dot) < bound) hitBoundry = true;
          if (Math.acos(p[1].dot) < bound) hitBoundry = true;
          //if(Math.acos(p[2].dot) < bound) hitBoundry = true;
        }
      }
    }
    
    const ceiling = screen.height / 2.0 - screen.height / distanceToWall;
    const floor = screen.height - ceiling;
    let shade = " ";
    if (hitBoundry) shade = " "
    else if (distanceToWall <= depth / 4.0) shade = "█";
    else if (distanceToWall <= depth / 3.0) shade = "▓";
    else if (distanceToWall <= depth / 2.0) shade = "▒";
    else if (distanceToWall <= depth / 1.0) shade = "░";
    else shade = " ";

    // Render in buffer
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

  console.log(`X=${player.x}, Y=${player.y}, A=${player.angle}, Key=${[...keyPressed].join('')}, FPS=${1 /elapsed}\n` + buffer.join(""));
  // Loop
  window.requestAnimationFrame(async () => await tick());
}

// Will display in HTML document instead of console
if (isBrowser) {
  console.log = (...args: any) => {
      window.document.body.innerText = args.join('');
  }
  console.clear = () => {} // Avoid to clean the real console in browser mode
}

tick();

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
