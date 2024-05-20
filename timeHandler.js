/****************************************************************************
 * timeHandler.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const {ipcRenderer} = require('electron');

const constants = require('./constants.js');
const ui = require('./ui.js');

let storedTimeZoneOffset = 0;

function sortPeriods (periods) {

    const sortedPeriods = periods.sort((a, b) => {

        return a.startMins - b.startMins;

    });

    return sortedPeriods;

}

exports.sortPeriods = sortPeriods;

function storeTimeZoneOffset () {

    storedTimeZoneOffset = 0;

    if (ui.getTimeZoneMode() === constants.TIME_ZONE_MODE_LOCAL) {

        const currentDate = new Date();

        storedTimeZoneOffset = -currentDate.getTimezoneOffset();

    }

    if (ui.getTimeZoneMode() === constants.TIME_ZONE_MODE_CUSTOM) {

        storedTimeZoneOffset = ipcRenderer.sendSync('request-custom-time-zone');

    }

}

exports.storeTimeZoneOffset = storeTimeZoneOffset;

function getTimeZoneOffset () {

    return storedTimeZoneOffset;

}

exports.getTimeZoneOffset = getTimeZoneOffset;

/* ------------------------------------------------- Time zone conversion functions ------------------------------------------------- */

function shiftTime (time, toUTC) {

    /* Offset is given as UTC - local time in minutes */

    let timeZoneOffset = storedTimeZoneOffset;

    timeZoneOffset = toUTC ? timeZoneOffset * -1 : timeZoneOffset;

    time = (time + timeZoneOffset) % constants.MINUTES_IN_DAY;

    /* If time zone offset move time over midnight */

    if (time < 0) {

        time += constants.MINUTES_IN_DAY;

    }

    return time;

}

function shiftTimePeriod (timePeriod, toUTC) {

    const startMins = shiftTime(timePeriod.startMins, toUTC);
    const endMins = shiftTime(timePeriod.endMins, toUTC);

    return {
        startMins,
        endMins
    };

}

exports.shiftTimePeriod = shiftTimePeriod;

/* Convert a list of time periods from UTC to local */

function shiftTimePeriods (tps, toUTC) {

    let shiftedTimePeriods = [];

    for (let i = 0; i < tps.length; i++) {

        const timePeriod = tps[i];
        const shiftedTimePeriod = shiftTimePeriod(timePeriod, toUTC);

        shiftedTimePeriods.push({
            startMins: shiftedTimePeriod.startMins,
            endMins: shiftedTimePeriod.endMins
        });

    }

    shiftedTimePeriods = sortPeriods(shiftedTimePeriods);

    shiftedTimePeriods = checkTimePeriodsForOverlaps(shiftedTimePeriods);

    return shiftedTimePeriods;

}

exports.shiftTimePeriods = shiftTimePeriods;

/* ------------------------------------------------- Time period checks ------------------------------------------------- */

/* See if any newly created time periods overlap and can be merged */

function checkTimePeriodsForOverlaps (timePeriods) {

    for (let i = 0; i < timePeriods.length; i++) {

        for (let j = 0; j < timePeriods.length; j++) {

            if (timePeriods[i].startMins === timePeriods[j].startMins && timePeriods[i].endMins === timePeriods[j].endMins) {

                continue;

            }

            if (timePeriods[i].endMins === timePeriods[j].startMins) {

                timePeriods[i].endMins = timePeriods[j].endMins;
                timePeriods.splice(j, 1);

                return checkTimePeriodsForOverlaps(timePeriods);

            }

        }

    }

    return timePeriods;

}

exports.checkTimePeriodsForOverlaps = checkTimePeriodsForOverlaps;

/* ------------------------------------------------- Other functions ------------------------------------------------- */

/* Get the text representation of the current timeZone */

function getTimeZoneText () {

    let timeZoneText = 'UTC';

    if (storedTimeZoneOffset === 0) return timeZoneText;

    const timeZoneOffsetHours = storedTimeZoneOffset < 0 ? Math.ceil(storedTimeZoneOffset / constants.MINUTES_IN_HOUR) : Math.floor(storedTimeZoneOffset / constants.MINUTES_IN_HOUR);

    const timeZoneOffsetMins = Math.abs(storedTimeZoneOffset % constants.MINUTES_IN_HOUR);

    timeZoneText += storedTimeZoneOffset > 0 ? '+' : '-';

    timeZoneText += Math.abs(timeZoneOffsetHours);

    if (timeZoneOffsetMins > 0) timeZoneText += ':' + ('00' + timeZoneOffsetMins).slice(-2);

    return timeZoneText;

}

exports.getTimeZoneText = getTimeZoneText;

/* Pad the left of each time with zeroes */

function pad (n) {

    return (n < 10) ? ('0' + n) : n;

}

/* Convert the number of minutes through a day to a HH:MM formatted string */

function minsToTimeString (mins) {

    const timeHours = Math.floor(mins / constants.MINUTES_IN_HOUR);

    return pad(timeHours) + ':' + pad((mins - (timeHours * constants.MINUTES_IN_HOUR)));

}

exports.minsToTimeString = minsToTimeString;
