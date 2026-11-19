/****************************************************************************
 * about.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

const electron = require('electron');
const {app, process} = require('@electron/remote');
const audiomoth = require('audiomoth-hid');

const nightMode = require('./nightMode.js');

const versionDisplay = document.getElementById('version-display');
const electronVersionDisplay = document.getElementById('electron-version-display');
const websiteLink = document.getElementById('website-link');
const audiomothHidVersionDisplay = document.getElementById('audiomoth-hid-version-display');
let allowWebsiteLinkFocus = false;

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

document.addEventListener('keydown', (event) => {

    allowWebsiteLinkFocus = event.key === 'Tab';

}, true);

document.addEventListener('mousedown', () => {

    allowWebsiteLinkFocus = false;

}, true);

websiteLink.addEventListener('mousedown', (event) => {

    event.preventDefault();

});

websiteLink.addEventListener('focus', () => {

    if (!allowWebsiteLinkFocus) {

        websiteLink.blur();
        return;

    }

    allowWebsiteLinkFocus = false;

});
