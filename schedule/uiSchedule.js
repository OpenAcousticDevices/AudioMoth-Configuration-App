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

const firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');
const firstRecordingDateLabel = document.getElementById('first-date-label');
const firstRecordingDateInput = document.getElementById('first-date-input');

const lastRecordingDateCheckbox = document.getElementById('last-date-checkbox');
const lastRecordingDateLabel = document.getElementById('last-date-label');
const lastRecordingDateInput = document.getElementById('last-date-input');

exports.updateTimeZoneStatus = () => {

    let timeZoneText = 'UTC';

    timeHandler.storeTimeZoneOffset();

    timeZoneText = timeHandler.getTimeZoneText();

    firstRecordingDateLabel.innerHTML = 'First recording date (' + timeZoneText + '):';
    lastRecordingDateLabel.innerHTML = 'Last recording date (' + timeZoneText + '):';

    uiScheduleEditor.disableRemoveTimeButton();

};

function startlastRecordingDateError (input) {

    if (input.disabled) {

        return;

    }

    input.style.border = '1px solid #0000ff';
    input.style.color = 'blue';

    setTimeout(function () {

        if (!input.disabled) {

            input.classList.remove('grey');

        }

        input.style.color = '';
        input.style.border = '';

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

        firstRecordingDateLabel.classList.remove('grey');
        firstRecordingDateInput.classList.remove('grey');
        firstRecordingDateInput.disabled = false;

    } else {

        firstRecordingDateLabel.classList.add('grey');
        firstRecordingDateInput.classList.add('grey');
        firstRecordingDateInput.disabled = true;

    }

}

/* Enable/disable start date entry based on checkbox */

function updateLastRecordingDateUI () {

    if (lastRecordingDateCheckbox.checked) {

        lastRecordingDateLabel.classList.remove('grey');
        lastRecordingDateInput.classList.remove('grey');
        lastRecordingDateInput.disabled = false;

    } else {

        lastRecordingDateLabel.classList.add('grey');
        lastRecordingDateInput.classList.add('grey');
        lastRecordingDateInput.disabled = true;

    }

}

exports.isFirstRecordingDateEnabled = () => {

    return firstRecordingDateCheckbox.checked;

};

exports.isLastRecordingDateEnabled = () => {

    return lastRecordingDateCheckbox.checked;

};

exports.getFirstRecordingDate = () => {

    return firstRecordingDateInput.value;

};

exports.getLastRecordingDate = () => {

    return lastRecordingDateInput.value;

};

exports.setFirstRecordingDate = (firstRecordingDateEnabled, firstRecordingDate) => {

    firstRecordingDateCheckbox.checked = firstRecordingDateEnabled;
    updateFirstRecordingDateUI();

    firstRecordingDateInput.value = firstRecordingDate;

};

exports.setLastRecordingDate = (lastRecordingDateEnabled, lastRecordingDate) => {

    lastRecordingDateCheckbox.checked = lastRecordingDateEnabled;
    updateLastRecordingDateUI();

    lastRecordingDateInput.value = lastRecordingDate;

};

exports.getSchedule = scheduleEditor.getTimePeriods();

/* First/last recording listeners */

firstRecordingDateInput.addEventListener('focusout', () => {

    checkDates(0);

});

lastRecordingDateInput.addEventListener('focusout', () => {

    checkDates(1);

});

firstRecordingDateCheckbox.addEventListener('change', () => {

    updateFirstRecordingDateUI();

});

lastRecordingDateCheckbox.addEventListener('change', () => {

    updateLastRecordingDateUI();

});

firstRecordingDateLabel.addEventListener('click', () => {

    firstRecordingDateCheckbox.toggleAttribute('checked');
    updateFirstRecordingDateUI();

});

lastRecordingDateLabel.addEventListener('click', () => {

    lastRecordingDateCheckbox.toggleAttribute('checked');
    updateLastRecordingDateUI();

});

exports.updateTimeList = uiScheduleEditor.updateTimeList;

/* Prepare UI */

exports.prepareUI = (changeFunction) => {

    const today = new Date();
    const todayString = ui.formatDateString(today);

    firstRecordingDateInput.value = todayString;
    lastRecordingDateInput.value = todayString;

    updateFirstRecordingDateUI();
    updateLastRecordingDateUI();

    uiScheduleEditor.prepareUI(changeFunction);

    /* Set up time display */

    ui.disableTimeDisplay();
    ui.showTime();

};

exports.addTime = scheduleEditor.addTime;
exports.clearTimes = scheduleEditor.clearTimes;
