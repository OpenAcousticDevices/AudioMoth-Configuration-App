/****************************************************************************
 * uiSchedule.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global document */

const ui = require('../ui.js');
const scheduleEditor = require('./scheduleEditor.js');
const uiScheduleEditor = require('./uiScheduleEditor.js');
const timeHandler = require('../timeHandler.js');

const dateInput = require('./dateInput.js');

var firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');
var firstRecordingDateLabel = document.getElementById('first-date-label');
var firstRecordingDateInput = document.getElementById('first-date-input');

var lastRecordingDateCheckbox = document.getElementById('last-date-checkbox');
var lastRecordingDateLabel = document.getElementById('last-date-label');
var lastRecordingDateInput = document.getElementById('last-date-input');

exports.updateTimezoneStatus = function (isLocalTime) {

    var timezoneText;

    timezoneText = 'UTC';

    if (isLocalTime) {

        timezoneText = timeHandler.getTimezoneText(isLocalTime);

    }

    firstRecordingDateLabel.innerHTML = 'First recording date (' + timezoneText + '):';
    lastRecordingDateLabel.innerHTML = 'Last recording date (' + timezoneText + '):';

    dateInput.updateLocalTimeStatus(firstRecordingDateInput, isLocalTime);
    dateInput.updateLocalTimeStatus(lastRecordingDateInput, isLocalTime);

    uiScheduleEditor.disableRemoveTimeButton();

};

function startlastRecordingDateError (input) {

    if (input.disabled) {

        return;

    }

    input.style.border = '2px solid #0000ff';
    input.style.color = 'blue';

    setTimeout(function () {

        input.style.border = '';
        input.style.color = '';

    }, 1000);

}

function checkDates (startEnd) {

    if (firstRecordingDateInput.value > lastRecordingDateInput.value) {

        if (startEnd === 0) {

            lastRecordingDateInput.value = firstRecordingDateInput.value;
            startlastRecordingDateError(lastRecordingDateInput);

        } else if (startEnd === 1) {

            firstRecordingDateInput.value = lastRecordingDateInput.value;
            startlastRecordingDateError(firstRecordingDateInput);

        }

    }

}

/* Enable/disable start date entry based on checkbox */

function updateFirstRecordingDateUI () {

    if (firstRecordingDateCheckbox.checked) {

        firstRecordingDateLabel.style.color = '';
        firstRecordingDateInput.style.color = '';
        firstRecordingDateInput.disabled = false;

    } else {

        firstRecordingDateLabel.style.color = 'lightgrey';
        firstRecordingDateInput.style.color = 'lightgrey';
        firstRecordingDateInput.disabled = true;

    }

}

/* Enable/disable start date entry based on checkbox */

function updateLastRecordingDateUI () {

    if (lastRecordingDateCheckbox.checked) {

        lastRecordingDateLabel.style.color = '';
        lastRecordingDateInput.style.color = '';
        lastRecordingDateInput.disabled = false;

    } else {

        lastRecordingDateLabel.style.color = 'lightgrey';
        lastRecordingDateInput.style.color = 'lightgrey';
        lastRecordingDateInput.disabled = true;

    }

}

exports.getFirstRecordingDate = function () {

    return firstRecordingDateCheckbox.checked ? firstRecordingDateInput.value : '';

};

exports.getLastRecordingDate = function () {

    return lastRecordingDateCheckbox.checked ? lastRecordingDateInput.value : '';

};

exports.setFirstRecordingDate = function (firstRecordingDate) {

    var today;

    today = new Date();

    firstRecordingDateCheckbox.checked = (firstRecordingDate !== '');
    updateFirstRecordingDateUI();

    firstRecordingDateInput.value = (firstRecordingDate !== '') ? firstRecordingDate : dateToString(today);

};

exports.setLastRecordingDate = function (lastRecordingDate) {

    var today;

    today = new Date();

    lastRecordingDateCheckbox.checked = (lastRecordingDate !== '');
    updateLastRecordingDateUI();

    lastRecordingDateInput.value = (lastRecordingDate !== '') ? lastRecordingDate : dateToString(today);

};

exports.getSchedule = scheduleEditor.getTimePeriods();

/* First/last recording listeners */

firstRecordingDateInput.addEventListener('focusout', function () {

    checkDates(0);

});

lastRecordingDateInput.addEventListener('focusout', function () {

    checkDates(1);

});

firstRecordingDateCheckbox.addEventListener('change', function () {

    updateFirstRecordingDateUI();

});

lastRecordingDateCheckbox.addEventListener('change', function () {

    updateLastRecordingDateUI();

});

function dateToString (date) {

    return date.toISOString().substring(0, 10);

}

firstRecordingDateLabel.addEventListener('click', function () {

    firstRecordingDateCheckbox.toggleAttribute('checked');
    updateFirstRecordingDateUI();

});

lastRecordingDateLabel.addEventListener('click', function () {

    lastRecordingDateCheckbox.toggleAttribute('checked');
    updateLastRecordingDateUI();

});

exports.updateTimeList = uiScheduleEditor.updateTimeList;

/* Prepare UI */

exports.prepareUI = function (changeFunction) {

    var year, month, day, today;

    today = new Date();

    year = ('000' + today.getUTCFullYear()).slice(-4);
    month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
    day = ('0' + today.getUTCDate()).slice(-2);
    today = year + '-' + month + '-' + day;

    firstRecordingDateInput.value = today;
    lastRecordingDateInput.value = today;

    updateFirstRecordingDateUI();
    updateLastRecordingDateUI();

    uiScheduleEditor.prepareUI(changeFunction);

    /* Set up time display */

    ui.disableTimeDisplay(true);
    ui.showTime();

};
