import './console-polyfill.ts';
import { WindowsTerminal } from "./windows-terminal/src/windows-terminal-plugin.ts";

const terminal = await WindowsTerminal.new();
terminal.create_console_screen_buffer();
const [width, height] = terminal.get_console_screen_info();

// Polyfill for window.requestAnimationFrame
window.requestAnimationFrame = (callback: () => void) => {
  setTimeout(() => callback(), 0);
};

console.log = (...args: unknown[]) => {
    terminal.write_console_output_character(args[0] as string);
}

console.clear = () => {}

export { width, height };
