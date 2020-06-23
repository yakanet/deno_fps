import "./console-polyfill.ts";
import { height, width } from "./native-polyfill.ts";
import { Game } from "./game.ts";

const game = new Game(width, height, { useBreakLine: false });
game.tick();
