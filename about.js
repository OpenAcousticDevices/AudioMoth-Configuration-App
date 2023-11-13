/****************************************************************************
 * about.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const {app, process} = require('@electron/remote');
const audiomoth = require('audiomoth-hid');

const nightMode = require('./nightMode.js');

const versionDisplay = document.getElementById('version-display');
const electronVersionDisplay = document.getElementById('electron-version-display');
const websiteLink = document.getElementById('website-link');
const audiomothHidVersionDisplay = document.getElementById('audiomoth-hid-version-display');

versionDisplay.textContent = 'Version ' + app.getVersion();
electronVersionDisplay.textContent = 'Running on Electron version ' + process.versions.electron;
audiomothHidVersionDisplay.textContent = 'AudioMoth-HID module ' + audiomoth.version;

electron.ipcRenderer.on('night-mode', (e, nm) => {

    if (nm !== undefined) {

        nightMode.setNightMode(nm);

    } else {

        nightMode.toggle();

    }

});

websiteLink.addEventListener('click', () => {

    electron.shell.openExternal('https://openacousticdevices.info');

});
