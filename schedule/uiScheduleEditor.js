/****************************************************************************
 * uiScheduleEditor.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');

const ariaSpeak = require('../ariaSpeak.js');

const schedule = require('../schedule/schedule.js');
const scheduleEditor = require('./scheduleEditor.js');
const timeHandler = require('../timeHandler.js');
const ui = require('../ui.js');
const timeInput = require('./timeInput.js');
const constants = require('../constants.js');

/* UI components */

const timeList = document.getElementById('time-list');
const addTimeButton = document.getElementById('add-time-button');
const removeTimeButton = document.getElementById('remove-time-button');
const clearTimeButton = document.getElementById('clear-time-button');

const startTimeInput = document.getElementById('start-time-input');
const endTimeInput = document.getElementById('end-time-input');

/* Function which uses changed schedule to update life approximation */

let updateLifeDisplayOnChange;

/* Pad the left of each time with zeroes */

function pad (n) {

    return (n < 10) ? ('0' + n) : n;

}

/* Obtain time periods from UI and add to data structure in response to button press */

function addTimeOnClick () {

    const startTimeSplit = timeInput.getValue(startTimeInput).split(':');
    const endTimeSplit = timeInput.getValue(endTimeInput).split(':');

    const startHours = parseInt(startTimeSplit[0], 10);
    const startMins = parseInt(startTimeSplit[1], 10);
    const endHours = parseInt(endTimeSplit[0], 10);
    const endMins = parseInt(endTimeSplit[1], 10);

    const startTimestamp = (startHours * constants.MINUTES_IN_HOUR) + startMins;
    let endTimestamp = (endHours * constants.MINUTES_IN_HOUR) + endMins;

    endTimestamp = (endTimestamp > 0) ? endTimestamp : 0;

    ariaSpeak.speak(pad(startHours) + ':' + pad(startMins) + ' to ' + pad(endHours) + ':' + pad(endMins));

    scheduleEditor.formatAndAddTime(startTimestamp, endTimestamp);

    scheduleEditor.updateScheduleBar();
    updateTimeList();
    scheduleEditor.clearSelectedPeriod();

}

function getTimePeriodFromList () {

    const values = timeList.value.split(',');

    const timePeriod = {
        startMins: parseInt(values[0], 10),
        endMins: parseInt(values[1], 10)
    };

    /* Allows time list to display 24:00 as 0:00 */
    timePeriod.endMins = (timePeriod.endMins === 0) ? 1440 : 0;

    return timePeriod;

}

function removeTimeOnClick () {

    let timePeriods = schedule.getTimePeriods();

    const timePeriod = getTimePeriodFromList();

    const timeZoneMode = ui.getTimeZoneMode();

    if (timeZoneMode === constants.TIME_ZONE_MODE_UTC) {

        timePeriods = scheduleEditor.removeTime(timePeriod, timePeriods);

    } else {

        let ltps = timeHandler.shiftTimePeriods(timePeriods, false);
        ltps = scheduleEditor.removeTime(timePeriod, ltps);

        timePeriods = timeHandler.shiftTimePeriods(ltps, true);

    }

    schedule.setTimePeriods(timePeriods);

    scheduleEditor.updateScheduleBar();
    updateTimeList();
    removeTimeButton.disabled = true;
    scheduleEditor.clearSelectedPeriod();

}

/* Fill UI list with time periods from data structure */

function updateTimeList () {

    let tp;

    const timePeriods = schedule.getTimePeriods();

    const timeZoneMode = ui.getTimeZoneMode();

    if (timeZoneMode === constants.TIME_ZONE_MODE_UTC) {

        tp = timePeriods;

    } else {

        tp = timeHandler.shiftTimePeriods(timePeriods, false);

    }

    timeList.options.length = 0;

    /* Sort recording periods in order of occurrence */

    tp = timeHandler.sortPeriods(tp);

    for (let i = 0; i < tp.length; i += 1) {

        const startMins = tp[i].startMins;
        let endMins = tp[i].endMins;
        endMins = endMins === 0 ? 1440 : endMins;

        const timeZoneText = '(' + timeHandler.getTimeZoneText() + ')';

        const option = document.createElement('option');
        option.text = timeHandler.minsToTimeString(startMins) + ' - ' + timeHandler.minsToTimeString(endMins) + ' ' + timeZoneText;
        option.value = [startMins, endMins];
        timeList.add(option);

    }

    /* Disable or enable action buttons in response to number time periods entered */

    addTimeButton.disabled = (tp.length >= schedule.MAX_PERIODS);
    clearTimeButton.disabled = (tp.length === 0);

    updateLifeDisplayOnChange();

}

exports.updateTimeList = updateTimeList;

electron.ipcRenderer.on('update-schedule', updateTimeList);

function clearTimesOnClick () {

    scheduleEditor.clearTimes();
    updateTimeList();
    removeTimeButton.disabled = true;
    scheduleEditor.clearSelectedPeriod();

}

exports.disableRemoveTimeButton = () => {

    removeTimeButton.disabled = true;

};

exports.prepareUI = (changeFunction) => {

    updateLifeDisplayOnChange = changeFunction;

    addTimeButton.addEventListener('click', addTimeOnClick);
    removeTimeButton.addEventListener('click', removeTimeOnClick);
    clearTimeButton.addEventListener('click', clearTimesOnClick);

    timeList.addEventListener('change', () => {

        removeTimeButton.disabled = (timeList.value === null || timeList.value === '');

        if (timeList.value !== null && timeList.value !== '') {

            const valueSplit = timeList.value.split(',');
            const selectedTimePeriod = {startMins: parseInt(valueSplit[0]), endMins: parseInt(valueSplit[1])};
            scheduleEditor.setSelectedPeriod(selectedTimePeriod);

        } else {

            scheduleEditor.clearSelectedPeriod();

        }

    });

    timeInput.setValue(endTimeInput, 24, 0);

};
