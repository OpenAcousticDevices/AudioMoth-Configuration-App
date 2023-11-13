/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');

const strftime = require('strftime');

const timeHandler = require('./timeHandler.js');
const scheduleBar = require('./scheduleBar.js');
const nightMode = require('./nightMode.js');
const constants = require('./constants.js');

/* UI components */

const timeZoneLabel = document.getElementById('time-zone-label');

const timeDisplay = document.getElementById('time-display');

let timeZoneMode = constants.TIME_ZONE_MODE_UTC;

let deviceDate;

/* Date formatting functions */

function formatDateString (date) {

    const year = ('0000' + date.getUTCFullYear()).slice(-4);
    const month = ('00' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('00' + date.getUTCDate()).slice(-2);

    return year + '-' + month + '-' + day;

}

exports.formatDateString = formatDateString;

function extractDateComponents (dateString) {

    const dateArray = dateString.split('-');

    const year = parseInt(dateArray[0]);
    const month = parseInt(dateArray[1]);
    const day = parseInt(dateArray[2]);

    return {
        year: year,
        month: month,
        day: day,
    };

}

exports.extractDateComponents = extractDateComponents;

/* Time zone mode function */

function getTimeZoneMode () {

    return timeZoneMode;

}

exports.getTimeZoneMode = getTimeZoneMode;

/* Generate and display current time in either UTC or local time */

function showTime () {

    if (deviceDate) {

        const timeZoneOffset = timeHandler.getTimeZoneOffset();

        const strftimeUTC = strftime.timezone(timeZoneOffset);

        if (timeDisplay) {

            timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y', deviceDate);

        }

    } else {

        timeDisplay.textContent = '--:--:-- --/--/----';

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

exports.disableTimeDisplay = () => {

    if (timeDisplay) {

        timeDisplay.classList.add('grey');

        timeZoneLabel.classList.add('grey');

    }

};

exports.enableTimeDisplay = () => {

    if (timeDisplay) {

        timeDisplay.classList.remove('grey');

        timeZoneLabel.classList.remove('grey');

    }

};

/* Switch between time zone modes (UTC, local, and custom) */

function setTimeZoneStatus (mode) {

    timeZoneMode = mode;

}

exports.setTimeZoneStatus = setTimeZoneStatus;

function updateTimeZoneUI () {

    const timeZoneText = timeHandler.getTimeZoneText();

    timeZoneLabel.innerHTML = timeZoneText;

    scheduleBar.clearSelectedPeriod();

    update();

}

exports.updateTimeZoneUI = updateTimeZoneUI;

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

electron.ipcRenderer.on('poll-night-mode', () => {

    electron.ipcRenderer.send('night-mode-poll-reply', nightMode.isEnabled());

});

exports.setSunriseSunsetEnabled = scheduleBar.setSunriseSunsetEnabled;
exports.isSunriseSunsetEnabled = scheduleBar.isSunriseSunsetEnabled;
exports.setSunriseSunset = scheduleBar.setSunriseSunset;
exports.getSunrise = scheduleBar.getSunrise;
exports.getSunset = scheduleBar.getSunset;
