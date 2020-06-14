// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiateAsync, __instantiate;

(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };

  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }

  __instantiateAsync = async (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExpA(m);
  };

  __instantiate = (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

System.register("console", [], function (exports_1, context_1) {
    "use strict";
    var encoder, decoder, UI, TTYUI, BrowserUI;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            encoder = new TextEncoder();
            decoder = new TextDecoder();
            UI = class UI {
                static of(type) {
                    switch (type) {
                        case 'browser':
                            return new BrowserUI();
                        case "console":
                            return new TTYUI();
                    }
                }
            };
            exports_1("UI", UI);
            TTYUI = class TTYUI extends UI {
                constructor(interval = 100) {
                    super();
                    this.interval = interval;
                    this.keyPressed = null;
                    this.isListening = false;
                    setInterval(() => {
                        this.addKeyListener();
                    }, interval);
                }
                loop(callback) {
                    setTimeout(() => {
                        callback();
                        setTimeout(() => this.loop(callback), this.interval);
                    }, this.interval);
                }
                get key() {
                    return this.keyPressed;
                }
                get isTTY() {
                    return true;
                }
                async addKeyListener() {
                    if (!this.isListening) {
                        this.isListening = true;
                        this.keyPressed = null;
                        const buffer = new Uint8Array(1024);
                        Deno.setRaw(0, true);
                        const length = await Deno.stdin.read(buffer);
                        Deno.setRaw(0, false);
                        await this.processKey(buffer.subarray(0, length));
                        this.isListening = false;
                    }
                }
                processKey(message) {
                    const keys = decoder.decode(message);
                    this.keyPressed = keys.split("")[0];
                }
                isKeyPressed(key) {
                    return this.keyPressed === key;
                }
                output(value) {
                    console.log(value);
                }
                clear() {
                    console.clear(); // Wrong implementation: not clearing the console
                    // @ts-ignore: Alternative impelementation
                    Deno.stdout.writeSync(encoder.encode("\x1B[2J"));
                }
            };
            BrowserUI = class BrowserUI extends UI {
                constructor() {
                    super();
                    this.keyPressed = new Set();
                    // @ts-ignore
                    addEventListener('keydown', (ev) => {
                        this.keyPressed.add(ev.key);
                    });
                    // @ts-ignore
                    addEventListener('keyup', (ev) => {
                        this.keyPressed.delete(ev.key);
                    });
                }
                loop(callback) {
                    // @ts-ignore
                    requestAnimationFrame(() => {
                        callback();
                        // @ts-ignore
                        requestAnimationFrame(() => this.loop(callback));
                    });
                }
                get isTTY() {
                    return false;
                }
                isKeyPressed(key) {
                    return this.keyPressed.has(key);
                }
                get key() {
                    return [...this.keyPressed].join(' ');
                }
                output(value) {
                    // @ts-ignore
                    if (document.body)
                        document.body.innerHTML = value;
                    //console.log(value);
                }
                clear() {
                    // Nothing to do
                    // console.clear();
                }
            };
        }
    };
});
System.register("mod", ["console"], function (exports_2, context_2) {
    "use strict";
    var console_ts_1, rawMap, screen, map, player, buffer, depth, fov, ui, clock, speed;
    var __moduleName = context_2 && context_2.id;
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
            player.x = player.x + Math.sin(player.angle) * speed.front * elapsed;
            player.y = player.y + Math.cos(player.angle) * speed.front * elapsed;
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
                const test = {
                    x: Math.floor(player.x + eye.x * distanceToWall),
                    y: Math.floor(player.y + eye.y * distanceToWall),
                };
                if (num(test.x).outside(0, map.width) ||
                    num(test.y).outside(0, map.height)) {
                    hitWall = true;
                    distanceToWall = depth;
                }
                else {
                    if (rawMap[test.y * map.width + test.x] === "#") {
                        hitWall = true;
                        const p = [];
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
                        if (Math.acos(p[0][1]) < bound)
                            hitBoundry = true;
                        if (Math.acos(p[1][1]) < bound)
                            hitBoundry = true;
                        //if(Math.acos(p[2][1]) < bound) hitBoundry = true;
                    }
                }
            }
            const ceiling = screen.height / 2.0 - screen.height / distanceToWall;
            const floor = screen.height - ceiling;
            let shade = " ";
            if (distanceToWall <= depth / 4.0)
                shade = "█";
            else if (distanceToWall <= depth / 3.0)
                shade = "▓";
            else if (distanceToWall <= depth / 2.0)
                shade = "▒";
            else if (distanceToWall <= depth / 1.0)
                shade = "░";
            else
                shade = " ";
            //░▒▓█
            if (hitBoundry) {
                shade = " ";
            }
            for (let y = 0; y < screen.height; y++) {
                if (y < ceiling) {
                    buffer[y * screen.width + x] = " ";
                }
                else if (y > ceiling && y <= floor) {
                    buffer[y * screen.width + x] = shade;
                }
                else {
                    const b = 1.0 - (y - screen.height / 2) / (screen.height / 2);
                    if (b < 0.25)
                        shade = "#";
                    else if (b < 0.5)
                        shade = "x";
                    else if (b < 0.75)
                        shade = ".";
                    else if (b < 0.9)
                        shade = "-";
                    else
                        shade = " ";
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
        ui.output(`X=${player.x}, Y=${player.y}, A=${player.angle}, Key=${ui.key}, FPS=${1 / elapsed}\n` +
            buffer.join(""));
    }
    function num(value) {
        return {
            between: (start, end) => {
                return value >= start && value < end;
            },
            outside: (start, end) => {
                return value < start || value >= end;
            },
        };
    }
    return {
        setters: [
            function (console_ts_1_1) {
                console_ts_1 = console_ts_1_1;
            }
        ],
        execute: function () {
            rawMap = `|################
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
            screen = { width: 120, height: 40 };
            map = { width: 16, height: 16 };
            player = { x: 8.0, y: 8.0, angle: 0.0 };
            buffer = new Array(screen.width * screen.height);
            depth = 16.0;
            fov = Math.PI / 4.0;
            // @ts-ignore
            ui = console_ts_1.UI.of(window.document ? 'browser' : 'console');
            clock = {
                start: performance.now(),
                end: performance.now(),
            };
            speed = { front: 2.0, side: 0.5 };
            ui.loop(async () => await tick());
        }
    };
});

__instantiate("mod");

