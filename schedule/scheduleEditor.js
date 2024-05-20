/****************************************************************************
 * scheduleEditor.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

const ui = require('../ui.js');
const timeHandler = require('../timeHandler.js');
const constants = require('../constants.js');

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

function addTime (startMins, endMins, timePeriods) {

    endMins = endMins === constants.MINUTES_IN_DAY ? 0 : endMins;

    let newStart, newEnd;

    if (startMins === endMins) {

        timePeriods = [];

        timePeriods.push({
            startMins,
            endMins
        });

        return timePeriods;

    }

    for (let i = 0; i < timePeriods.length; i++) {

        const existingStartMins = timePeriods[i].startMins;
        let existingEndMins = timePeriods[i].endMins;
        existingEndMins = existingEndMins === constants.MINUTES_IN_DAY ? 0 : existingEndMins;

        /* Check if the new period is just a time inside an existing period */

        if (isSubset(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Subset');

            return timePeriods;

        }

        if (isSuperset(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Superset');

            timePeriods = removeTime(timePeriods[i], timePeriods);

            timePeriods = addTime(startMins, endMins, timePeriods);

            return timePeriods;

        }

        if (startEndOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Start and end overlaps');

            timePeriods = removeTime(timePeriods[i], timePeriods);

            timePeriods = addTime(startMins, startMins, timePeriods);

            return timePeriods;

        }

        if (startOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('Start overlaps');

            newStart = existingStartMins;
            newEnd = endMins;

            timePeriods = removeTime(timePeriods[i], timePeriods);

            timePeriods = addTime(newStart, newEnd, timePeriods);

            return timePeriods;

        }

        if (endOverlaps(existingStartMins, existingEndMins, startMins, endMins)) {

            console.log('End overlaps');

            newStart = startMins;
            newEnd = existingEndMins;

            timePeriods = removeTime(timePeriods[i], timePeriods);

            timePeriods = addTime(newStart, newEnd, timePeriods);

            return timePeriods;

        }

    }

    timePeriods.push({
        startMins,
        endMins
    });

    return timePeriods;

}

function formatAndAddTime (startTimestamp, endTimestamp, timePeriods) {

    let utcPeriod;

    const timePeriod = {
        startMins: startTimestamp,
        endMins: endTimestamp
    };

    const timeZoneMode = ui.getTimeZoneMode();

    if (timeZoneMode === constants.TIME_ZONE_MODE_UTC) {

        utcPeriod = {
            startMins: (timePeriod.startMins % constants.MINUTES_IN_DAY),
            endMins: (timePeriod.endMins % constants.MINUTES_IN_DAY)
        };

    } else {

        utcPeriod = timeHandler.shiftTimePeriod(timePeriod, true);

    }

    startTimestamp = utcPeriod.startMins;
    endTimestamp = utcPeriod.endMins;

    timePeriods = addTime(startTimestamp, endTimestamp, timePeriods);

    return timePeriods;

}

exports.addTime = addTime;
exports.formatAndAddTime = formatAndAddTime;
