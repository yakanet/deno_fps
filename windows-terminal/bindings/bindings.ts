// Auto-generated with deno_bindgen
import { CachePolicy, prepare } from "https://deno.land/x/plug@0.5.1/plug.ts"
function encode(v: string | Uint8Array): Uint8Array {
  if (typeof v !== "string") return v
  return new TextEncoder().encode(v)
}
function decode(v: Uint8Array): string {
  return new TextDecoder().decode(v)
}
function readPointer(v: any): Uint8Array {
  const ptr = new Deno.UnsafePointerView(v as Deno.UnsafePointer)
  const lengthBe = new Uint8Array(4)
  const view = new DataView(lengthBe.buffer)
  ptr.copyInto(lengthBe, 0)
  const buf = new Uint8Array(view.getUint32(0))
  ptr.copyInto(buf, 4)
  return buf
}
const opts = {
  name: "windows_terminal_plugin",
  url: (new URL("../target/debug", import.meta.url)).toString(),
  policy: CachePolicy.NONE,
}
const _lib = await prepare(opts, {
  get_console_screen_info: {
    parameters: [],
    result: "pointer",
    nonblocking: false,
  },
  write_console_output_character: {
    parameters: ["pointer", "usize"],
    result: "void",
    nonblocking: false,
  },
})
export type Size = {
  width: number
  height: number
}
export function get_console_screen_info() {
  let rawResult = _lib.symbols.get_console_screen_info()
  const result = readPointer(rawResult)
  return JSON.parse(decode(result)) as Size
}
export function write_console_output_character(a0: string) {
  const a0_buf = encode(a0)
  let rawResult = _lib.symbols.write_console_output_character(
    a0_buf,
    a0_buf.byteLength,
  )
  const result = rawResult
  return result
}
