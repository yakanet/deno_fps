export {};

/**
 * Extends Deno TTY api based on browser API
 */
declare global {
  interface Window {
    requestAnimationFrame: (cb: () => void) => void;
  }
}
