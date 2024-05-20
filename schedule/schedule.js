/****************************************************************************
 * schedule.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const constants = require('../constants.js');

let timePeriods = [];

exports.getTimePeriodCount = () => {

    return timePeriods.length;

};

exports.clear = () => {

    timePeriods = [];

};

/* Recording period data structure getter and setter */

exports.getTimePeriods = () => {

    return timePeriods;

};

/* Older firmware doesn't support time periods where startMins > endMins. Replace periods which do this with a period either side of midnight */

exports.getTimePeriodsNoWrap = () => {

    const noWrapTimePeriods = [];

    for (let i = 0; i < timePeriods.length; i++) {

        const startMins = timePeriods[i].startMins;
        const endMins = timePeriods[i].endMins;

        if (startMins >= endMins && endMins !== 0) {

            noWrapTimePeriods.push({
                startMins,
                endMins: constants.MINUTES_IN_DAY
            });

            noWrapTimePeriods.push({
                startMins: 0,
                endMins
            });

        } else {

            noWrapTimePeriods.push(timePeriods[i]);

        }

    }

    let sortedPeriods = noWrapTimePeriods;
    sortedPeriods = sortedPeriods.sort((a, b) => {

        return a.startMins - b.startMins;

    });

    return sortedPeriods;

};

exports.setTimePeriods = (tp) => {

    timePeriods = tp;

};
