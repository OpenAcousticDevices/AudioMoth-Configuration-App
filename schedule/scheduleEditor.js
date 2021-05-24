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

function overlaps (startTime1, endTime1, startTime2, endTime2) {

    return (startTime1 <= endTime2 && endTime1 >= startTime2);

}

exports.overlaps = overlaps;

/* Add a new recording period to the data structure and update UI */

function addTime (startMins, endMins) {

    let timePeriods, newStart, newEnd;

    timePeriods = schedule.getTimePeriods();

    for (let i = 0; i < timePeriods.length; i++) {

        /* If an overlap occurs, attempt to merge the overlapping time periods */

        if (overlaps(timePeriods[i].startMins, timePeriods[i].endMins, startMins, endMins)) {

            if (timePeriods.length < schedule.MAX_PERIODS) {

                newStart = Math.min(startMins, timePeriods[i].startMins);
                newEnd = Math.max(endMins, timePeriods[i].endMins);

                timePeriods = removeTime(timePeriods[i], timePeriods);

                schedule.setTimePeriods(timePeriods);

                return addTime(newStart, newEnd);

            }

            return false;

        }

    }

    timePeriods.push({
        startMins: startMins,
        endMins: endMins
    });

    schedule.setTimePeriods(timePeriods);

    return true;

}

function formatAndAddTime (startTimestamp, endTimestamp) {

    let utcPeriod, added;

    const timePeriod = {
        startMins: startTimestamp,
        endMins: endTimestamp
    };

    if (ui.isLocalTime()) {

        utcPeriod = timeHandler.convertTimePeriodToUTC(timePeriod);

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

        if (schedule.getTimePeriodCount() < schedule.MAX_PERIODS) {

            added = addTime(0, endTimestamp - 1440) && added;

        }

    } else {

        added = addTime(startTimestamp, endTimestamp);

    }

    /* Return success boolean (used to report failure when manually adding period) */

    return added;

}

exports.formatAndAddTime = formatAndAddTime;

exports.getTimePeriods = schedule.getTimePeriods;
exports.setTimePeriods = schedule.setTimePeriods;

scheduleBar.prepareScheduleCanvas(true, function (selectedIndex) {

    timeList.options.selectedIndex = selectedIndex;
    timeList.focus();
    timeList.dispatchEvent(new Event('change'));

});
