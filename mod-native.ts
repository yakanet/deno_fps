import "./console-polyfill.ts";
import { height, width } from "./native-polyfill.ts";
import { Game } from "./game.ts";

const game = new Game(width, height - 1, { useBreakLine: false });
game.tick();
