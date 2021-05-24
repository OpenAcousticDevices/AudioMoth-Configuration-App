/****************************************************************************
 * schedule.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const MAX_PERIODS = 4;
exports.MAX_PERIODS = MAX_PERIODS;

var timePeriods = [];

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

exports.setTimePeriods = (tp) => {

    timePeriods = tp;

};
