Based on https://github.com/OneLoneCoder/CommandLineFPS

# Run in console
```
deno run --unstable .\mod.ts
```
Press c to quit

# Run in browser
```
deno bundle --unstable mod.ts > bundle.js
npx http-server .
```

# Run in console using deno plugin (works only on Windows)
```
deno run --unstable -A .\mod-native.ts
```
