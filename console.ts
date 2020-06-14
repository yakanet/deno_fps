const encoder = new TextEncoder();
const decoder = new TextDecoder();

export abstract class UI {

  static of(type: "console" | "browser"): UI {
    switch(type){
      case 'browser':
        return new BrowserUI();
      case "console":
        return new TTYUI();
    }
  }

  abstract get key(): string | null;
  abstract get isTTY(): boolean;

  public abstract loop(callback: () => void): void;
  public abstract isKeyPressed(key: string): boolean;
  public abstract output(value: string): void;
  public abstract clear(): void;
}

class TTYUI extends UI {
  private keyPressed: string | null = null;

  private isListening = false;

  constructor(private interval = 100) {
    super();
    setInterval(() => {
      this.addKeyListener();
    }, interval);
  }

  public loop(callback: () => void) {
    setTimeout(() => {
      callback();
      setTimeout(() => this.loop(callback), this.interval);
    }, this.interval);
  }

  get key(): string | null{
    return this.keyPressed;
  }

  get isTTY() {
    return true;
  }

  private async addKeyListener() {
    if (!this.isListening) {
      this.isListening = true;
      this.keyPressed = null;
      const buffer = new Uint8Array(1024);
      Deno.setRaw(0, true);
      const length = <number>await Deno.stdin.read(buffer);
      Deno.setRaw(0, false);
      await this.processKey(buffer.subarray(0, length));
      this.isListening = false;
    }
  }

  private processKey(message: Uint8Array) {
    const keys = decoder.decode(message);
    this.keyPressed = keys.split("")[0];
  }

  public isKeyPressed(key: string) {
    return this.keyPressed === key;
  }

  public output(value: string) {
    console.log(value);
  }

  
  clear() {
    console.clear(); // Wrong implementation: not clearing the console
    // @ts-ignore: Alternative impelementation
    Deno.stdout.writeSync(encoder.encode("\x1B[2J"));
  }
}

class BrowserUI extends UI {
  private keyPressed = new Set<string>();

  constructor(){
    super();
    // @ts-ignore
    addEventListener('keydown', (ev: {key: string}) => {
      this.keyPressed.add(ev.key);
    });
    // @ts-ignore
    addEventListener('keyup', (ev: {key: string}) => {
      this.keyPressed.delete(ev.key);
    });
  }

  loop(callback: () => void){
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
 
  public isKeyPressed(key: string) {
    return this.keyPressed.has(key);
  }

  public get key(): string | null {
    return [...this.keyPressed].join(' ')
  }

  public output(value: string) {
    // @ts-ignore
    if(document.body) document.body.innerHTML = value;
    //console.log(value);
  }

  public clear(){
    // Nothing to do
   // console.clear();
  }
}
