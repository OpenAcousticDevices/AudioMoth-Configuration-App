/****************************************************************************
 * uiScheduleEditor.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');

const schedule = require('../schedule/schedule.js');
const scheduleEditor = require('./scheduleEditor.js');
const timeHandler = require('../timeHandler.js');
const ui = require('../ui.js');
const timeInput = require('./timeInput.js');

/* UI components */

var timeList = document.getElementById('time-list');
var addTimeButton = document.getElementById('add-time-button');
var removeTimeButton = document.getElementById('remove-time-button');
var clearTimeButton = document.getElementById('clear-time-button');

var startTimeInput = document.getElementById('start-time-input');
var endTimeInput = document.getElementById('end-time-input');

/* Function which uses changed schedule to update life approximation */

var updateLifeDisplayOnChange;

/* Obtain time periods from UI and add to data structure in response to button press */

function addTimeOnClick () {

    var startTimeSplit, endTimeSplit, startTimestamp, endTimestamp;

    startTimeSplit = timeInput.getValue(startTimeInput).split(':');
    endTimeSplit = timeInput.getValue(endTimeInput).split(':');

    startTimestamp = (parseInt(startTimeSplit[0], 10) * 60) + parseInt(startTimeSplit[1], 10);
    endTimestamp = (parseInt(endTimeSplit[0], 10) * 60) + parseInt(endTimeSplit[1], 10);

    endTimestamp = (endTimestamp > 0) ? endTimestamp : 1440;

    scheduleEditor.formatAndAddTime(startTimestamp, endTimestamp);

    scheduleEditor.updateScheduleBar();
    updateTimeList();
    scheduleEditor.clearSelectedPeriod();

}

function getTimePeriodFromList () {

    var values, timePeriod;

    values = timeList.value.split(',');

    timePeriod = {
        startMins: parseInt(values[0], 10),
        endMins: parseInt(values[1], 10)
    };

    /* Allows time list to display 24:00 as 0:00 */
    timePeriod.endMins = (timePeriod.endMins === 0) ? 1440 : 0;

    return timePeriod;

}

function removeTimeOnClick () {

    var timePeriods, timePeriod, ltps;

    timePeriods = schedule.getTimePeriods();

    timePeriod = getTimePeriodFromList();

    if (ui.isLocalTime()) {

        ltps = timeHandler.convertTimePeriodsToLocal(timePeriods);
        ltps = scheduleEditor.removeTime(timePeriod, ltps);

        timePeriods = timeHandler.convertLocalTimePeriodsToUTC(ltps);

    } else {

        timePeriods = scheduleEditor.removeTime(timePeriod, timePeriods);

    }

    schedule.setTimePeriods(timePeriods);

    scheduleEditor.updateScheduleBar();
    updateTimeList();
    removeTimeButton.disabled = true;
    scheduleEditor.clearSelectedPeriod();

}

/* Fill UI list with time periods from data structure */

function updateTimeList () {

    var timePeriods, tp, i, startMins, endMins, timezoneText, timezoneOffset, option;

    timePeriods = schedule.getTimePeriods();

    if (ui.isLocalTime()) {

        tp = timeHandler.convertTimePeriodsToLocal(timePeriods);

    } else {

        tp = timePeriods;

    }

    timeList.options.length = 0;

    /* Sort recording periods in order of occurrence */

    tp = tp.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    for (i = 0; i < tp.length; i += 1) {

        startMins = tp[i].startMins;
        endMins = tp[i].endMins;

        timezoneText = '(UTC';
        if (ui.isLocalTime()) {

            timezoneOffset = timeHandler.calculateTimezoneOffsetHours();

            if (timezoneOffset >= 0) {

                timezoneText += '+';

            }

            timezoneText += timezoneOffset;

        }

        timezoneText += ')';

        option = document.createElement('option');
        option.text = timeHandler.minsToTimeString(startMins) + ' - ' + timeHandler.minsToTimeString(endMins) + ' ' + timezoneText;
        option.value = [startMins, endMins];
        timeList.add(option);

    }

    /* Disable or enable action buttons in response to number time periods entered */

    addTimeButton.disabled = (tp.length >= schedule.MAX_PERIODS);
    clearTimeButton.disabled = (tp.length === 0);

    updateLifeDisplayOnChange();

}

exports.updateTimeList = updateTimeList;

electron.ipcRenderer.on('local-time-schedule', updateTimeList);

function clearTimesOnClick () {

    scheduleEditor.clearTimes();
    updateTimeList();
    removeTimeButton.disabled = true;
    scheduleEditor.clearSelectedPeriod();

}

exports.disableRemoveTimeButton = function () {

    removeTimeButton.disabled = true;

};

exports.prepareUI = function (changeFunction) {

    var valueSplit, selectedTimePeriod;

    updateLifeDisplayOnChange = changeFunction;

    addTimeButton.addEventListener('click', addTimeOnClick);
    removeTimeButton.addEventListener('click', removeTimeOnClick);
    clearTimeButton.addEventListener('click', clearTimesOnClick);

    timeList.addEventListener('change', function () {

        removeTimeButton.disabled = (timeList.value === null || timeList.value === '');

        if (timeList.value !== null && timeList.value !== '') {

            valueSplit = timeList.value.split(',');
            selectedTimePeriod = {startMins: parseInt(valueSplit[0]), endMins: parseInt(valueSplit[1])};
            scheduleEditor.setSelectedPeriod(selectedTimePeriod);

        } else {

            scheduleEditor.clearSelectedPeriod();

        }

    });

    timeInput.setValue(endTimeInput, 24, 0);

};
