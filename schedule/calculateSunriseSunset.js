/****************************************************************************
 * calculateSunriseSunset.js
 * openacousticdevices.info
 * December 2023
 *****************************************************************************/

const constants = require('../constants.js');

const ZENITH_ANGLES = [90.833 / 180 * Math.PI, 96 / 180 * Math.PI, 102 / 180 * Math.PI, 108 / 180 * Math.PI];

const DAYS_BY_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeapYear (year) {

    return (year & 3) === 0 && ((year % 25) !== 0 || (year & 15) === 0);

}

function dayOfYear (year, month, day) {

    let days = DAYS_BY_MONTH[month] + day;

    if (isLeapYear(year) && month > 2) days++;

    return days;

}

function normalise (minutes) {

    if (minutes > constants.MINUTES_IN_DAY) minutes -= constants.MINUTES_IN_DAY;

    if (minutes < 0) minutes += constants.MINUTES_IN_DAY;

    return minutes;

}

function calculateSunsetAndSunrise (event, gamma, latitude, longitude) {

    /* Convert latitude to radians */

    latitude = latitude / 180 * Math.PI;

    /* Calculate equation of time, declination and hour angle */

    const zenith = ZENITH_ANGLES[event];

    const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    let argument = Math.cos(zenith) / Math.cos(latitude) / Math.cos(decl) - Math.tan(latitude) * Math.tan(decl);

    const solution = argument > 1 ? constants.SUN_BELOW_HORIZON : argument < -1 ? constants.SUN_ABOVE_HORIZON : constants.NORMAL_SOLUTION;

    let trend = argument < 0 ? constants.DAY_LONGER_THAN_NIGHT : constants.DAY_SHORTER_THAN_NIGHT;

    if (argument < -1) argument = -1;

    if (argument > 1) argument = 1;

    const ha = Math.acos(argument);

    /* Calculate sunrise and sunset */

    let sunrise = normalise(constants.MINUTES_IN_DAY / 2 - 4 * (longitude + ha / Math.PI * 180) - equationOfTime);

    let sunset = normalise(constants.MINUTES_IN_DAY / 2 - 4 * (longitude - ha / Math.PI * 180) - equationOfTime);

    sunrise = Math.round(sunrise) % constants.MINUTES_IN_DAY;

    sunset = Math.round(sunset) % constants.MINUTES_IN_DAY;

    let offsetSunrise = sunrise + constants.MINUTES_IN_DAY / 2;

    offsetSunrise = offsetSunrise % constants.MINUTES_IN_DAY;

    if (offsetSunrise === sunset) trend = constants.DAY_EQUAL_TO_NIGHT;

    return [solution, trend, sunrise, sunset];

}

function degreesAndHundredthsToFloatingPoint (degrees, hundredths, direction) {

    let latLon = degrees + hundredths / 100;

    if (direction === false) latLon *= -1;

    return latLon;

}

exports.calculate = (event, year, month, day, degrees0, hundredths0, direction0, degrees1, hundredths1, direction1) => {

    const latitude = degreesAndHundredthsToFloatingPoint(degrees0, hundredths0, direction0);

    const longitude = degreesAndHundredthsToFloatingPoint(degrees1, hundredths1, direction1);

    /* Calculate fractional part of year */

    const totalDaysInYear = isLeapYear(year) ? 366 : 365;

    const gamma = 2 * Math.PI * dayOfYear(year, month, day) / totalDaysInYear;

    /* Calculate sunrise and sunset */

    return calculateSunsetAndSunrise(event, gamma, latitude, longitude);

};
