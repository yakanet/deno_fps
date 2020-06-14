/**
 * Extends Deno TTY api based on browser API
 */
declare global {
  interface Window {
    requestAnimationFrame: (cb: () => void) => void;
    document: {
      body: {
        innerText: string;
      };
    };
  }

  interface KeyboardEvent extends Event {
    key: string;
  }
}

export const isBrowser = window.hasOwnProperty("document");
export const isDeno = !isBrowser;

// Polyfill for window.document.body.innerText
if (isDeno) {
  window.document = {
    body: {
      set innerText(value: string) {
        console.log(value);
      },
    },
  };
}

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
    for (let key of keyPressed) {
      const event = new Event("keydown");
      (<any>event).key = key;
      dispatchEvent(event);
      if(key === 'c') {
          Deno.exit(0);
      }
    }
  };

  const dispachKeyUp = () => {
    for (let key of keyPressed) {
      const event = new Event("keyup") as KeyboardEvent;
      event.key = key;
      dispatchEvent(event);
    }
    keyPressed.length = 0;
  };

  Deno.setRaw(Deno.stdin.rid, true);
  setInterval(async () => {
    isListening = true;
    dispachKeyUp();
    const buffer = new Uint8Array(1024);
    const length = <number>await Deno.stdin.read(buffer);
    dispachKeyDown(buffer.subarray(0, length));
    //Deno.setRaw(0, false);
    isListening = false;
  }, interval);
}

// Clear: in Deno console.clear should clear the console.
if (isDeno) {
  const encoder = new TextEncoder();
  console.clear = () => {
    Deno.stdout.writeSync(encoder.encode("\x1B[2J"));
  };
} else {
  console.clear = () => {}; // Avoid to clean the real console in browser mode
}
