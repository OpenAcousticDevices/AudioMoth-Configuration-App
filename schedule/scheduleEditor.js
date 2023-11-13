/****************************************************************************
 * scheduleEditor.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global Event */

const ui = require('../ui.js');
const scheduleBar = require('../scheduleBar.js');
const timeHandler = require('../timeHandler.js');
const schedule = require('../schedule/schedule.js');
const constants = require('../constants.js');

const timeList = document.getElementById('time-list');

exports.setSelectedPeriod = scheduleBar.setSelectedPeriod;
exports.clearSelectedPeriod = scheduleBar.clearSelectedPeriod;

/* Remove a time from the recording period data structure and update UI to reflect change */

function removeTime (timePeriod, tps) {

    const startMins = timePeriod.startMins;

    for (let i = 0; i < tps.length; i++) {

        if (tps[i].startMins === startMins) {

            tps.splice(i, 1);

        }

    }

    return tps;

}

exports.removeTime = removeTime;

/* Rebuild the schedule bar using current state of schedule */

function updateScheduleBar () {

    scheduleBar.updateCanvas();

}

exports.updateScheduleBar = updateScheduleBar;

/* Remove all recordings periods and update UI */

function clearTimes () {

    schedule.clear();
    updateScheduleBar();

}

exports.clearTimes = clearTimes;

/* Check to see if two periods of time overlap */

function isSubset (startTime1, endTime1, startTime2, endTime2) {

    const a = startTime1 < endTime1 && startTime2 < endTime2 && startTime2 >= startTime1 && endTime2 <= endTime1;
    const b = startTime1 > endTime1 && startTime2 < endTime2 && startTime2 >= startTime1 && (endTime2 >= startTime1 || endTime2 <= endTime1);
    const c = startTime1 > endTime1 && startTime2 < endTime2 && startTime2 <= endTime1 && endTime2 <= endTime1;
    const d = startTime1 > endTime1 && startTime2 > endTime2 && startTime2 > startTime1 && endTime2 < endTime1;
    const e = startTime1 === endTime1;

    return a || b || c || d || e;

}

function isSuperset (startTime1, endTime1, startTime2, endTime2) {

    return isSubset(startTime2, endTime2, startTime1, endTime1);

}

function startEndOverlaps (startTime1, endTime1, startTime2, endTime2) {

    const a = startTime1 < endTime1 && startTime2 > endTime2 && endTime2 >= startTime1 && startTime2 <= endTime1;
    const b = startTime1 > endTime1 && startTime2 < endTime2 && startTime2 <= endTime1 && endTime2 >= startTime1;
    const c = startTime1 > endTime1 && startTime2 > endTime2 && endTime2 >= startTime1 && startTime2 >= endTime1;
    const d = startTime1 > endTime1 && startTime2 > endTime2 && endTime2 <= startTime1 && startTime2 <= endTime1;

    return a || b || c || d;

}

function startOverlaps (startTime1, endTime1, startTime2, endTime2) {

    const a = startTime1 < endTime1 && startTime2 >= startTime1 && startTime2 <= endTime1;
    const b = startTime1 > endTime1 && startTime2 >= startTime1;
    const c = startTime1 > endTime1 && startTime2 <= endTime1;

    return a || b || c;

}

function endOverlaps (startTime1, endTime1, startTime2, endTime2) {

    const a = startTime1 < endTime1 && endTime2 >= startTime1 && endTime2 <= endTime1;
    const b = startTime1 > endTime1 && endTime2 >= startTime1;
    const c = startTime1 > endTime1 && endTime2 <= endTime1;

    return a || b || c;

}

/* Add a new recording period to the data structure and update UI */

function addTime (startMins, endMins) {

    endMins = endMins === 1440 ? 0 : endMins;

    let timePeriods, newStart, newEnd;

    timePeriods = schedule.getTimePeriods();

    if (startMins === endMins) {

        timePeriods = [];

        timePeriods.push({
            startMins,
            endMins
        });

        schedule.setTimePeriods(timePeriods);

        return;

    }

    for (let i = 0; i < timePeriods.length; i++) {

        const existingStartMins = timePeriods[i].startMins;
        let existingEndMins = timePeriods[i].endMins;
        existingEndMins = existingEndMins === 1440 ? 0 : existingEndMins;

        /* Check if the new period is just a time inside an existing period */

        if (isSubset(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Subset');

            return true;

        }

        if (isSuperset(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Superset');

            timePeriods = removeTime(timePeriods[i], timePeriods);

            schedule.setTimePeriods(timePeriods);

            return addTime(startMins, endMins);

        }

        if (startEndOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Start and end overlaps');

            timePeriods = removeTime(timePeriods[i], timePeriods);

            schedule.setTimePeriods(timePeriods);

            return addTime(startMins, startMins);

        }

        if (startOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Start overlaps');

            newStart = existingStartMins;
            newEnd = endMins;

            timePeriods = removeTime(timePeriods[i], timePeriods);

            schedule.setTimePeriods(timePeriods);

            return addTime(newStart, newEnd);

        }

        if (endOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('End overlaps');

            newStart = startMins;
            newEnd = existingEndMins;

            timePeriods = removeTime(timePeriods[i], timePeriods);

            schedule.setTimePeriods(timePeriods);

            return addTime(newStart, newEnd);

        }

    }

    timePeriods.push({
        startMins,
        endMins
    });

    schedule.setTimePeriods(timePeriods);

    return true;

}

function formatAndAddTime (startTimestamp, endTimestamp) {

    let utcPeriod;

    const timePeriod = {
        startMins: startTimestamp,
        endMins: endTimestamp
    };

    const timeZoneMode = ui.getTimeZoneMode();

    if (timeZoneMode === constants.TIME_ZONE_MODE_UTC) {

        utcPeriod = {
            startMins: (timePeriod.startMins % 1440),
            endMins: (timePeriod.endMins % 1440)
        };

    } else {

        utcPeriod = timeHandler.shiftTimePeriod(timePeriod, true);

    }

    startTimestamp = utcPeriod.startMins;
    endTimestamp = utcPeriod.endMins;

    const added = addTime(startTimestamp, endTimestamp);

    /* Return success boolean (used to report failure when manually adding period) */

    return added;

}

exports.addTime = addTime;
exports.formatAndAddTime = formatAndAddTime;

exports.getTimePeriods = schedule.getTimePeriods;
exports.setTimePeriods = schedule.setTimePeriods;

scheduleBar.prepareScheduleCanvas(function (selectedIndex) {

    timeList.options.selectedIndex = selectedIndex;
    timeList.focus();
    timeList.dispatchEvent(new Event('change'));

});
