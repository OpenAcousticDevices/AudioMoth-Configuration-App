/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const menu = electron.remote.Menu;
const ipc = electron.ipcRenderer;

const strftime = require('strftime');

const timeHandler = require('./timeHandler.js');
const scheduleBar = require('./scheduleBar.js');
const nightMode = require('./nightMode.js');

/* UI components */

const applicationMenu = menu.getApplicationMenu();

const timezoneLabel = document.getElementById('timezone-label');

const timeDisplay = document.getElementById('time-display');

var localTime = false;

var deviceDate = new Date(0);

function isLocalTime () {

    return localTime;

}

exports.isLocalTime = isLocalTime;

function setLocalTime (lTime) {

    localTime = lTime;
    applicationMenu.getMenuItemById('localTime').checked = localTime;

}

/* Generate and display current time in either UTC or local time */

function showTime () {

    let timezoneOffset = 0;

    if (isLocalTime()) {

        timezoneOffset = timeHandler.calculateTimezoneOffsetMins();

    }

    const strftimeUTC = strftime.timezone(timezoneOffset);

    if (timeDisplay) {

        timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y', deviceDate);

    }

}

exports.showTime = showTime;

/* Run all UI update functions */

function update () {

    scheduleBar.updateCanvas();

    if (timeDisplay) {

        showTime();

    }

}

exports.update = update;

exports.updateDate = (date) => {

    deviceDate = date;

};

exports.disableTimeDisplay = (blankValue) => {

    if (timeDisplay) {

        timeDisplay.style.color = 'lightgrey';

        timezoneLabel.style.color = 'lightgrey';

        if (blankValue) {

            deviceDate = new Date(0);

        }

    }

};

exports.enableTimeDisplay = () => {

    let textColor;

    if (timeDisplay) {

        if (nightMode.isEnabled()) {

            textColor = 'white';

        } else {

            textColor = 'black';

        }

        timeDisplay.style.color = textColor;
        timezoneLabel.style.color = textColor;

    }

};

/* Switch between time zone modes (UTC and local) */

function setTimezoneStatus (local) {

    let timezoneText = 'UTC';

    setLocalTime(local);

    if (isLocalTime()) {

        timezoneText = timeHandler.getTimezoneText(isLocalTime());

    }

    timezoneLabel.innerHTML = timezoneText;

    scheduleBar.clearSelectedPeriod();

    update();

}

exports.setTimezoneStatus = setTimezoneStatus;

function toggleTimezoneStatus () {

    setTimezoneStatus(!isLocalTime());

}

exports.toggleTimezoneStatus = toggleTimezoneStatus;

function setNightMode (nm) {

    nightMode.setNightMode(nm);

    scheduleBar.updateCanvas();
    scheduleBar.drawTimeLabels();

}

exports.setNightMode = setNightMode;

function toggleNightMode () {

    nightMode.toggle();

    scheduleBar.updateCanvas();
    scheduleBar.drawTimeLabels();

}

exports.toggleNightMode = toggleNightMode;

exports.isNightMode = nightMode.isEnabled;

function checkUtcToggleability () {

    const timezoneOffset = timeHandler.calculateTimezoneOffsetMins();

    if (timezoneOffset === 0) {

        applicationMenu.getMenuItemById('localTime').enabled = false;
        return false;

    }

    return true;

}

ipc.on('poll-night-mode', function () {

    electron.ipcRenderer.send('night-mode-poll-reply', nightMode.isEnabled());

});

exports.checkUtcToggleability = checkUtcToggleability;

exports.setSunriseSunsetEnabled = scheduleBar.setSunriseSunsetEnabled;
exports.isSunriseSunsetEnabled = scheduleBar.isSunriseSunsetEnabled;
exports.setSunriseSunset = scheduleBar.setSunriseSunset;
exports.getSunrise = scheduleBar.getSunrise;
exports.getSunset = scheduleBar.getSunset;

exports.calculateTimezoneOffsetMins = timeHandler.calculateTimezoneOffsetMins;
