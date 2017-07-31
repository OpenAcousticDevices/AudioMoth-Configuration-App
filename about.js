/****************************************************************************
 * about.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*global document */

var electron = require('electron');
var audiomoth = require('audiomoth-hid');

var versionDisplay = document.getElementById('version-display');
var electronVersionDisplay = document.getElementById('electron-version-display');
var audiomothHidVersionDisplay = document.getElementById('audiomoth-hid-version-display');
var websiteLink = document.getElementById('website-link');

versionDisplay.textContent = "Version " + electron.remote.app.getVersion();
electronVersionDisplay.textContent = "Running on Electron version " + electron.remote.process.versions.electron;
audiomothHidVersionDisplay.textContent = "AudioMoth-HID module " + audiomoth.version;

websiteLink.addEventListener('click', function () {
    electron.shell.openExternal("https://openacousticdevices.info");
});