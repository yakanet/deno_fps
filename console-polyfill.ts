export {};
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

// Polyfill for window.document.body.innerText
if (!window.document) {
  window.document = {
    body: {
      set innerText(value: string) {
        console.log(value);
      },
    },
  };
}

if (!window.requestAnimationFrame) {
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

// Polyfill for window.requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback: () => void) => {
    const interval = 100;
    setTimeout(() => {
      callback();
    }, interval);
  };
}

// Clear: in Deno console.clear should clear the console.
if(typeof(Deno) !== 'undefined') {
    const encoder = new TextEncoder();

    console.clear = () => {
        Deno.stdout.writeSync(encoder.encode("\x1B[2J"));
    }
} else {
    console.clear = () => {} // Avoid to clean the real console in browser mode
}