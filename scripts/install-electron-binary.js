'use strict';

/* global process, __dirname */

const fs = require('fs');
const fsp = require('fs/promises');
const https = require('https');
const path = require('path');
const os = require('os');
const {spawn, execSync} = require('child_process');
const {pipeline} = require('stream/promises');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const ELECTRON_DIR = path.join(ROOT_DIR, 'node_modules', 'electron');
const DIST_DIR = path.join(ROOT_DIR, 'node_modules', 'electron', 'dist');
const PATH_TXT_PATH = path.join(ELECTRON_DIR, 'path.txt');

function quoteForPowerShell (value) {

    return `'${String(value).replace(/'/g, "''")}'`;

}

function readPackageJson () {

    return fsp.readFile(PACKAGE_JSON_PATH, 'utf8').then(JSON.parse);

}

function getElectronVersion (pkg) {

    const rawVersion = (pkg.devDependencies && pkg.devDependencies.electron) || (pkg.dependencies && pkg.dependencies.electron);

    if (!rawVersion) {

        throw new Error('Electron was not found in package.json dependencies.');

    }

    const match = String(rawVersion).match(/\d+\.\d+\.\d+/);

    if (!match) {

        throw new Error(`Unable to parse Electron version from \"${rawVersion}\".`);

    }

    return match[0];

}

function getTargetPlatformArch () {

    const platform = process.env.ELECTRON_INSTALL_PLATFORM || process.env.npm_config_platform || process.platform;
    let arch = process.env.ELECTRON_INSTALL_ARCH || process.env.npm_config_arch || process.arch;

    if (platform === 'darwin' && process.platform === 'darwin' && arch === 'x64' && process.env.npm_config_arch === undefined) {

        /* Match Electron's installer behaviour under Rosetta. */
        try {

            const output = execSync('sysctl -in sysctl.proc_translated', {encoding: 'utf8'});

            if (output.trim() === '1') {

                arch = 'arm64';

            }

        } catch {

            /* Ignore and keep current arch. */

        }

    }

    return {platform, arch};

}

function getReleaseFilename (version, platform, arch) {

    const supportedArchesByPlatform = {
        win32: ['x64', 'arm64', 'ia32'],
        darwin: ['x64', 'arm64'],
        linux: ['x64', 'arm64', 'armv7l']
    };

    if (!supportedArchesByPlatform[platform]) {

        throw new Error(`Unsupported platform: ${platform}.`);

    }

    if (!supportedArchesByPlatform[platform].includes(arch)) {

        throw new Error(`Unsupported architecture for ${platform}: ${arch}.`);

    }

    return `electron-v${version}-${platform}-${arch}.zip`;

}

function getElectronPathTxtValue () {

    if (process.platform === 'win32') {

        return 'electron.exe';

    }

    if (process.platform === 'darwin') {

        return 'Electron.app/Contents/MacOS/Electron';

    }

    if (process.platform === 'linux') {

        return 'electron';

    }

    throw new Error(`Unsupported platform: ${process.platform}.`);

}

async function downloadToFile (url, destinationPath, redirects = 0) {

    if (redirects > 8) {

        throw new Error('Too many redirects while downloading Electron binary.');

    }

    await new Promise((resolve, reject) => {

        const request = https.get(url, {
            headers: {
                'User-Agent': 'audiomoth-flash-electron-installer'
            }
        }, (response) => {

            const statusCode = response.statusCode || 0;

            if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {

                response.resume();

                const nextUrl = new URL(response.headers.location, url).toString();

                downloadToFile(nextUrl, destinationPath, redirects + 1).then(resolve).catch(reject);
                return;

            }

            if (statusCode !== 200) {

                response.resume();
                reject(new Error(`Download failed with status ${statusCode} from ${url}.`));
                return;

            }

            const fileStream = fs.createWriteStream(destinationPath);

            pipeline(response, fileStream).then(resolve).catch(reject);

        });

        request.on('error', reject);

    });

}

function runCommand (command, args) {

    return new Promise((resolve, reject) => {

        const child = spawn(command, args, {
            stdio: 'inherit'
        });

        child.on('error', reject);

        child.on('exit', (code) => {

            if (code === 0) {

                resolve();
                return;

            }

            reject(new Error(`${command} exited with code ${code}.`));

        });

    });

}

async function extractArchive (zipPath, destinationPath) {

    if (process.platform === 'win32') {

        const psCommand = `Expand-Archive -LiteralPath ${quoteForPowerShell(zipPath)} -DestinationPath ${quoteForPowerShell(destinationPath)} -Force`;

        await runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCommand]);
        return;

    }

    await runCommand('unzip', ['-o', zipPath, '-d', destinationPath]);

}

async function main () {

    try {

        await fsp.access(PATH_TXT_PATH, fs.constants.F_OK);
        console.log('Electron binary is already installed. Skipping download.');
        return;

    } catch {

        /* path.txt does not exist, continue with download/install flow. */

    }

    const pkg = await readPackageJson();
    const version = getElectronVersion(pkg);
    const {platform, arch} = getTargetPlatformArch();
    const filename = getReleaseFilename(version, platform, arch);
    const downloadUrl = `https://github.com/electron/electron/releases/download/v${version}/${filename}`;
    const tempZipPath = path.join(os.tmpdir(), `electron-${version}-${Date.now()}.zip`);

    console.log(`Electron version: ${version}`);
    console.log(`Target platform/arch: ${platform}/${arch}`);
    console.log(`Downloading: ${downloadUrl}`);

    try {

        await downloadToFile(downloadUrl, tempZipPath);

        await fsp.rm(DIST_DIR, {recursive: true, force: true});
        await fsp.mkdir(ELECTRON_DIR, {recursive: true});
        await fsp.mkdir(DIST_DIR, {recursive: true});

        console.log(`Extracting archive to: ${DIST_DIR}`);

        await extractArchive(tempZipPath, DIST_DIR);

        const pathTxtValue = getElectronPathTxtValue();

        await fsp.writeFile(PATH_TXT_PATH, pathTxtValue, 'utf8');

        console.log('Electron binary download and extraction complete.');

    } finally {

        await fsp.rm(tempZipPath, {force: true});

    }

}

main().catch((error) => {

    console.error(error.message);
    process.exit(1);

});
