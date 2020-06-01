/****************************************************************************
 * schedule.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const MAX_PERIODS = 4;
exports.MAX_PERIODS = MAX_PERIODS;

var timePeriods = [];

exports.getTimePeriodCount = function () {

    return timePeriods.length;

};

exports.clear = function () {

    timePeriods = [];

};

/* Recording period data structure getter and setter */

exports.getTimePeriods = function () {

    return timePeriods;

};

exports.setTimePeriods = function (tp) {

    timePeriods = tp;

};
