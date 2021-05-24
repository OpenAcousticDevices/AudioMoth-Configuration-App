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

const firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');
const firstRecordingDateLabel = document.getElementById('first-date-label');
const firstRecordingDateInput = document.getElementById('first-date-input');

const lastRecordingDateCheckbox = document.getElementById('last-date-checkbox');
const lastRecordingDateLabel = document.getElementById('last-date-label');
const lastRecordingDateInput = document.getElementById('last-date-input');

exports.updateTimezoneStatus = (isLocalTime) => {

    let timezoneText = 'UTC';

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

exports.getFirstRecordingDate = () => {

    return firstRecordingDateCheckbox.checked ? firstRecordingDateInput.value : '';

};

exports.getLastRecordingDate = () => {

    return lastRecordingDateCheckbox.checked ? lastRecordingDateInput.value : '';

};

exports.setFirstRecordingDate = (firstRecordingDate) => {

    const today = new Date();

    firstRecordingDateCheckbox.checked = (firstRecordingDate !== '');
    updateFirstRecordingDateUI();

    firstRecordingDateInput.value = (firstRecordingDate !== '') ? firstRecordingDate : dateToString(today);

};

exports.setLastRecordingDate = (lastRecordingDate) => {

    const today = new Date();

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

exports.prepareUI = (changeFunction) => {

    const today = new Date();

    const year = ('000' + today.getUTCFullYear()).slice(-4);
    const month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + today.getUTCDate()).slice(-2);
    const todayString = year + '-' + month + '-' + day;

    firstRecordingDateInput.value = todayString;
    lastRecordingDateInput.value = todayString;

    updateFirstRecordingDateUI();
    updateLastRecordingDateUI();

    uiScheduleEditor.prepareUI(changeFunction);

    /* Set up time display */

    ui.disableTimeDisplay(true);
    ui.showTime();

};
