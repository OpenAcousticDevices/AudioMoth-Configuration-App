/****************************************************************************
 * about.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const audiomoth = require('audiomoth-hid');

const nightMode = require('./nightMode.js');

const versionDisplay = document.getElementById('version-display');
const electronVersionDisplay = document.getElementById('electron-version-display');
const audiomothHidVersionDisplay = document.getElementById('audiomoth-hid-version-display');
const websiteLink = document.getElementById('website-link');

versionDisplay.textContent = 'Version ' + electron.remote.app.getVersion();
electronVersionDisplay.textContent = 'Running on Electron version ' + electron.remote.process.versions.electron;
audiomothHidVersionDisplay.textContent = 'AudioMoth-HID module ' + audiomoth.version;

electron.ipcRenderer.on('night-mode', (e, nm) => {

    if (nm !== undefined) {

        nightMode.setNightMode(nm);

    } else {

        nightMode.toggle();

    }

});

websiteLink.addEventListener('click', function () {

    electron.shell.openExternal('https://openacousticdevices.info');

});
