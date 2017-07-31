/****************************************************************************
 * timePeriods.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/*global document*/

var ui = require('./ui.js');
var lifeDisplay = require('./lifeDisplay.js');

var timePeriods = [];

var MAX_PERIODS = 5;

/* UI components */

var timeList = document.getElementById('time-list');
var addTimeButton = document.getElementById('add-time-button');
var removeTimeButton = document.getElementById('remove-time-button');
var clearTimeButton = document.getElementById('clear-time-button');

var startTimeInput = document.getElementById('start-time-input');
var endTimeInput = document.getElementById('end-time-input');

/* Pad the left of each time with zeroes */

function pad(n) {

    return (n < 10) ? ("0" + n) : n;

}

/* Convert the number of minutes through a day to a HH:MM formatted string */

function minsToTimeString(mins) {

    var timeHours = Math.floor(mins / 60);

    return pad(timeHours) + ":" + pad((mins - (timeHours * 60)));

}

/* Fill UI list with time periods from data structure */

function updateTimeList() {

    var i, option;

    timeList.options.length = 0;

    /* Sort recording periods in order of occurrence */

    timePeriods = timePeriods.sort(function (a, b) {
        return a.startMins - b.startMins;
    });

    for (i = 0; i < timePeriods.length; i += 1) {

        option = document.createElement("option");
        option.text = minsToTimeString(timePeriods[i].startMins) + " - " + minsToTimeString(timePeriods[i].endMins);
        option.value = timePeriods[i].startMins;
        timeList.add(option);

    }

    /* Disable or enable action buttons in response to number time periods entered */

    addTimeButton.disabled = (timePeriods.length === MAX_PERIODS);
    clearTimeButton.disabled = (timePeriods.length === 0);

}

exports.updateTimeList = updateTimeList;

/* Run all UI update functions */

function updateUI() {

    updateTimeList();
    ui.updateCanvas(timePeriods);
    lifeDisplay.updateLifeDisplay(timePeriods);

}

/* Remove a time from the recording period data structure and update UI to reflect change */

function removeTime(value) {

    var i;
    for (i = 0; i < timePeriods.length; i += 1) {
        if (timePeriods[i].startMins === value) {
            timePeriods.splice(i, 1);
            updateUI();
            removeTimeButton.disabled = true;
            return;
        }
    }

}

/* Remove all recordings periods and update UI */

function clearTimes() {

    timePeriods = [];
    updateUI();

}

/* Check to see if two periods of time overlap */

function overlaps(startTime1, endTime1, startTime2, endTime2) {

    return (startTime1 <= endTime2 && endTime1 >= startTime2);

}

/* Add a new recording period to the data structure and update UI */

function addTime(startMins, endMins) {

    var i, newStart, newEnd;

    for (i = 0; i < timePeriods.length; i += 1) {

        /* If an overlap occurs, attempt to merge the overlapping time periods */

        if (overlaps(timePeriods[i].startMins, timePeriods[i].endMins, startMins, endMins)) {

            if (timePeriods.length < MAX_PERIODS) {

                newStart = Math.min(startMins, timePeriods[i].startMins);
                newEnd = Math.max(endMins, timePeriods[i].endMins);
                removeTime(timePeriods[i].startMins);
                return addTime(newStart, newEnd);

            }

            return false;

        }

    }

    timePeriods.push({
        startMins: startMins,
        endMins: endMins
    });

    updateUI();
    return true;

}

/* Obtain time periods from UI and add to data structure in response to button press */

function addTimeOnClick() {

    var startTimeSplit, endTimeSplit, startTimestamp, endTimestamp, added;

    startTimeSplit = startTimeInput.value.split(":");
    endTimeSplit = endTimeInput.value.split(":");
    startTimestamp = (parseInt(startTimeSplit[0], 10) * 60) + parseInt(startTimeSplit[1], 10);
    endTimestamp = (parseInt(endTimeSplit[0], 10) * 60) + parseInt(endTimeSplit[1], 10);

    /* If a start time entered exceeds the end of the day, subtract 24 hours */

    if (startTimestamp > 1440) {

        added = addTime(startTimestamp - 1440, endTimestamp);

    } else {

        /* If end time precedes start time, assume period should wrap around midnight */

        if (endTimestamp < startTimestamp) {

            endTimestamp += 1440;

        }

        if (endTimestamp > 1440) {

            /* Split time period into two periods either side of midnight */

            added = addTime(startTimestamp, 1440);
            added = addTime(0, endTimestamp - 1440) && added;

        } else {

            added = addTime(startTimestamp, endTimestamp);

        }

    }

    /* Make it clear time input was rejected */

    if (!added) {

        ui.setTimeInputStyleError();
        setTimeout(ui.setTimeInputStyleDefault, 2500);

    }

}

/* Recording period data structure getter and setter */

exports.getTimePeriods = function () {
    return timePeriods;
};

exports.setTimePeriods = function (tp) {
    timePeriods = tp;
};

/* Add button listeners */

addTimeButton.addEventListener('click', function () {
    ui.checkTimeInputs(addTimeOnClick);
});

removeTimeButton.addEventListener('click', function () {
    removeTime(parseInt(timeList.value, 10));
});

clearTimeButton.addEventListener('click', clearTimes);

/* If the time list is empty, disable the user's ability to remove more recording periods */

timeList.addEventListener('change', function () {
    removeTimeButton.disabled = (timeList.value === null);
});