# Deno Cross platform

Based on [CommandLineFPS](https://github.com/OneLoneCoder/CommandLineFPS)

This program attempt to run the same program using 3 environments.

## Run in console

```batch
deno run --unstable .\mod.ts
```

> Press c to quit

## Run in browser

```batch
deno bundle --unstable mod.ts > bundle.js
npx http-server .
```

## Run in console using deno plugin (works only on Windows)

Require rustup-msvc to be installed

```batch
cd windows-terminal
cargo build
deno run --unstable -A .\mod-native.ts
```

> Press c to quit
