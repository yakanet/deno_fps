import './console-polyfill.ts';
import {
  get_console_screen_info,
  write_console_output_character
} from './windows-terminal/bindings/bindings.ts';

const { width, height } = get_console_screen_info();

// Polyfill for window.requestAnimationFrame
window.requestAnimationFrame = (callback: () => void) => {
  setTimeout(() => callback(), 0);
};

console.log = (...args: unknown[]) => {
  write_console_output_character(args[0] as string);
}

console.clear = () => { }

export { width, height };
