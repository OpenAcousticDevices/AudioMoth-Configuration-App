/****************************************************************************
 * timePeriods.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/*global document*/

var ui = require('./ui.js');
var lifeDisplay = require('./lifeDisplay.js');

var electron = require('electron');
var menu = electron.remote.Menu;

var timePeriods = [];

var MAX_PERIODS = 4;
exports.MAX_PERIODS = MAX_PERIODS;

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

/* Check if the given times need to be altered to match the app's current time zone setting */

function convertTimePeriodToUTC(timePeriod) {

    var startMins, endMins, timezoneOffset;

    startMins = timePeriod.startMins;
    endMins = timePeriod.endMins;

    /* Offset is given as UTC - local time in minutes */

    timezoneOffset = ui.calculateTimezoneOffsetMins();

    startMins = (startMins - timezoneOffset) % 1440;
    endMins = (endMins - timezoneOffset) % 1440;

    /* If time zone offset move time over midnight */

    if (startMins < 0) {

        startMins += 1440;

    }

    if (endMins < 0) {

        endMins += 1440;

    }

    /* If the start and end times are the same, the time period covers the entire day */

    if (startMins === endMins) {

        return timePeriod;

    }

    return {
        startMins: startMins,
        endMins: endMins
    };

}

exports.convertTimePeriodToUTC = convertTimePeriodToUTC;

function convertTimePeriodToLocal(timePeriod) {

    var startMins, endMins, timezoneOffset;

    startMins = timePeriod.startMins;
    endMins = timePeriod.endMins;

    /* Offset is given as UTC - local time in minutes */

    timezoneOffset = ui.calculateTimezoneOffsetMins();

    startMins = (startMins + timezoneOffset) % 1440;
    endMins = (endMins + timezoneOffset) % 1440;

    /* If time zone offset move time over midnight */

    if (startMins < 0) {

        startMins += 1440;

    }

    if (endMins < 0) {

        endMins += 1440;

    }

    /* If the start and end times are the same, the time period covers the entire day */

    if (startMins === endMins) {

        return timePeriod;

    }

    return {
        startMins: startMins,
        endMins: endMins
    };

}

/* See if any periods are over midnight and have to be split */

function checkTimePeriodsForSplits(localTimePeriods) {

    var i, localTimePeriod;

    for (i = 0; i < localTimePeriods.length; i += 1) {

        localTimePeriod = localTimePeriods[i];

        if (localTimePeriod.startMins > localTimePeriod.endMins) {

            localTimePeriods.splice(i, 1);

            localTimePeriods.push({
                startMins: localTimePeriod.startMins,
                endMins: 1440
            });
            localTimePeriods.push({
                startMins: 0,
                endMins: localTimePeriod.endMins
            });

        }

    }

    return localTimePeriods;

}

/* See if any newly created time periods overlap and can be merged */

function checkTimePeriodsForOverlaps(localTimePeriods) {

    var i, j;

    for (i = 0; i < localTimePeriods.length; i += 1) {

        for (j = 0; j < localTimePeriods.length; j += 1) {

            if (localTimePeriods[i].endMins === localTimePeriods[j].startMins) {

                localTimePeriods[i].endMins = localTimePeriods[j].endMins;
                localTimePeriods.splice(j, 1);

                return checkTimePeriodsForOverlaps(localTimePeriods);

            }

        }

    }

    return localTimePeriods;

}

/* Convert a list of time periods from UTC to local */

function convertTimePeriodsToLocal(tps) {

    var localTimePeriods, i, timePeriod, localTimePeriod;

    localTimePeriods = [];

    for (i = 0; i < tps.length; i += 1) {

        timePeriod = tps[i];
        localTimePeriod = convertTimePeriodToLocal(timePeriod);

        localTimePeriods.push({
            startMins: localTimePeriod.startMins,
            endMins: localTimePeriod.endMins
        });

    }

    localTimePeriods = checkTimePeriodsForSplits(localTimePeriods);

    localTimePeriods = localTimePeriods.sort(function (a, b) {
        return a.startMins - b.startMins;
    });

    localTimePeriods = checkTimePeriodsForOverlaps(localTimePeriods);

    return localTimePeriods;

}

/* Convert a list of local time periods to UTC */

function convertLocalTimePeriodsToUTC(localTimePeriods) {

    var utcTimePeriods, i, localTimePeriod, utcTimePeriod;

    utcTimePeriods = [];

    for (i = 0; i < localTimePeriods.length; i += 1) {

        localTimePeriod = localTimePeriods[i];

        utcTimePeriod = convertTimePeriodToUTC(localTimePeriod);

        utcTimePeriods.push({
            startMins: utcTimePeriod.startMins,
            endMins: utcTimePeriod.endMins
        });

    }

    utcTimePeriods = checkTimePeriodsForSplits(utcTimePeriods);

    utcTimePeriods = utcTimePeriods.sort(function (a, b) {
        return a.startMins - b.startMins;
    });

    utcTimePeriods = checkTimePeriodsForOverlaps(utcTimePeriods);

    return utcTimePeriods;

}

/* Fill UI list with time periods from data structure */

function updateTimeList() {

    var tp, i, startMins, endMins, timezoneText, timezoneOffset, option;

    if (ui.isLocalTime()) {

        tp = convertTimePeriodsToLocal(timePeriods);

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

        timezoneText = "(UTC";
        if (ui.isLocalTime()) {

            timezoneOffset = ui.calculateTimezoneOffsetHours();

            if (timezoneOffset >= 0) {
                timezoneText += "+";
            }

            timezoneText += timezoneOffset;
        }
        timezoneText += ")";

        option = document.createElement("option");
        option.text = minsToTimeString(startMins) + " - " + minsToTimeString(endMins) + " " + timezoneText;
        option.value = [startMins, endMins];
        timeList.add(option);

    }

    /* Disable or enable action buttons in response to number time periods entered */

    addTimeButton.disabled = (tp.length >= MAX_PERIODS);
    clearTimeButton.disabled = (tp.length === 0);

}

exports.updateTimeList = updateTimeList;

/* Remove a time from the recording period data structure and update UI to reflect change */

function removeTime(timePeriod, tps) {

    var i, startMins = timePeriod.startMins;

    for (i = 0; i < tps.length; i += 1) {

        if (tps[i].startMins === startMins) {

            tps.splice(i, 1);

        }

    }

    return tps;

}

/* Remove all recordings periods and update UI */

function clearTimes() {

    timePeriods = [];
    ui.updateUI();

}

exports.clearTimes = clearTimes;

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

                timePeriods = removeTime(timePeriods[i], timePeriods);
                return addTime(newStart, newEnd);

            }

            return false;

        }

    }

    timePeriods.push({
        startMins: startMins,
        endMins: endMins
    });

    return true;

}

/* Obtain time periods from UI and add to data structure in response to button press */

function addTimeOnClick() {

    var startTimeSplit, endTimeSplit, startTimestamp, endTimestamp, timePeriod, utcPeriod, added;

    startTimeSplit = startTimeInput.value.split(":");
    endTimeSplit = endTimeInput.value.split(":");
    startTimestamp = (parseInt(startTimeSplit[0], 10) * 60) + parseInt(startTimeSplit[1], 10);
    endTimestamp = (parseInt(endTimeSplit[0], 10) * 60) + parseInt(endTimeSplit[1], 10);

    timePeriod = {
        startMins: startTimestamp,
        endMins: endTimestamp
    };

    if (ui.isLocalTime()) {

        utcPeriod = convertTimePeriodToUTC(timePeriod);

    } else {

        utcPeriod = {
            startMins: (timePeriod.startMins % 1440),
            endMins: (timePeriod.endMins % 1440)
        };

    }

    startTimestamp = utcPeriod.startMins;
    endTimestamp = utcPeriod.endMins;

    /* If end time precedes start time, assume period should wrap around midnight */

    if (endTimestamp < startTimestamp) {

        endTimestamp += 1440;

    }

    if (endTimestamp === startTimestamp) {

        added = addTime(0, 1440);

    } else if (endTimestamp > 1440) {

        /* Split time period into two periods either side of midnight */

        added = addTime(startTimestamp, 1440);

        if (timePeriods.length < MAX_PERIODS) {

            added = addTime(0, endTimestamp - 1440) && added;

        }

    } else {

        added = addTime(startTimestamp, endTimestamp);

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
    ui.updateUI();
});

removeTimeButton.addEventListener('click', function () {

    var values, timePeriod, ltps;

    values = timeList.value.split(",");

    timePeriod = {
        startMins: parseInt(values[0], 10),
        endMins: parseInt(values[1], 10)
    };

    if (ui.isLocalTime()) {

        ltps = convertTimePeriodsToLocal(timePeriods);
        ltps = removeTime(timePeriod, ltps);

        timePeriods = convertLocalTimePeriodsToUTC(ltps);

    } else {

        timePeriods = removeTime(timePeriod, timePeriods);

    }

    ui.updateUI();
    removeTimeButton.disabled = true;

});

clearTimeButton.addEventListener('click', clearTimes);

/* If the time list is empty, disable the user's ability to remove more recording periods */

timeList.addEventListener('change', function () {
    removeTimeButton.disabled = (timeList.value === null || timeList.value === "");
});