/// <reference path="./global.d.ts" />

const isBrowser = window.hasOwnProperty("document");
const isDeno = !isBrowser;

//#region Console
// Polyfill for window.requestAnimationFrame
if (isDeno) {
  window.requestAnimationFrame = (callback: () => void) => {
    const interval = 100;
    setTimeout(() => {
      callback();
    }, interval);
  };
}

// Polyfill for keydown & keyup
if (isDeno) {
  const interval = 100;

  let isListening = false;
  let keyPressed: string[] = [];
  const decoder = new TextDecoder();

  const dispachKeyDown = (message: Uint8Array) => {
    const keys = decoder.decode(message);
    keyPressed = keys.split("");
    for (const key of keyPressed) {
      const event = Object.assign(new Event("keydown"), { key });
      dispatchEvent(event);
      if (key === "c") {
        Deno.exit(0);
      }
    }
  };

  const dispachKeyUp = () => {
    for (const key of keyPressed) {
      const event = Object.assign(new Event("keyup"), { key });
      dispatchEvent(event);
    }
    keyPressed.length = 0;
  };

  setInterval(async () => {
    if (!isListening) {
      isListening = true;
      dispachKeyUp();
      Deno.setRaw(Deno.stdin.rid, true);
      const buffer = new Uint8Array(1024);
      const length = <number>await Deno.stdin.read(buffer);
      dispachKeyDown(buffer.subarray(0, length));
      Deno.setRaw(0, false);
      isListening = false;
    }
  }, interval);
}
//#endregion

//#region Browser
// Will display in HTML document instead of console
if (isBrowser) {
  console.log = (...args: unknown[]) => {
    // @ts-ignore
    window.document.body.innerText = args.join("");
  };
  console.clear = () => {}; // Avoid to clean the real console in browser mode
}
//#endregion
