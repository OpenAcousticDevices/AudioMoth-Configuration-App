Sometimes Electron fails to install correctly when running `npm install`. When you try to run the application using `npm start`, it will attempt to download the required Electron binaries then fail, complaining about a missing file called `path.txt`.

`path.txt` should contain the following:

On Windows:
```
electron.exe
```
On MacOS:
```
Electron.app/Contents/MacOS/Electron
```
On Linux:
```
electron
```

Everything but the binaries and `path.txt` downloads, so run the helper script to download and extract the correct Electron release for your OS/architecture and create `path.txt`:

```
npm run install-electron-binary
```

This script reads the Electron version from `package.json`, downloads the matching release from [Electron Github releases](https://github.com/electron/electron/releases), and extracts it to `./node_modules/electron/dist`.

Finally, run `npm start` to verify Electron is now actually installed.