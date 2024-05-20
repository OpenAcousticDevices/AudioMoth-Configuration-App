/****************************************************************************
 * uiSun.js
 * openacousticdevices.info
 * January 2024
 *****************************************************************************/

const electron = require('electron');
const {ipcRenderer} = require('electron');
const {dialog, BrowserWindow} = require('@electron/remote');

const constants = require('../constants.js');
const timeHandler = require('../timeHandler.js');
const calculateSunriseSunset = require('./calculateSunriseSunset.js');
const scheduleEditor = require('./scheduleEditor.js');
const ui = require('../ui.js');

let scaleFactor = 1;

const sunCanvas = document.getElementById('sun-canvas');
const sunContext = sunCanvas.getContext('2d');

const sunTab = document.getElementById('sun-tab');

const coordinateInput = require('./coordinateInput.js');
const sunIntervalInput = require('./sunIntervalInput.js');
const roundingInput = require('./roundingInput.js');

let latInput;
let lonInput;

let sunriseBeforeIntervalInput;
let sunriseAfterIntervalInput;

let sunsetBeforeIntervalInput;
let sunsetAfterIntervalInput;

const sunModeSelect = document.getElementById('sun-mode-select');

let sunRoundingInput;

const firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');
const firstRecordingDateInput = document.getElementById('first-date-input');

const mapButton = document.getElementById('map-button');

function updateMapWindow () {

    const lat = coordinateInput.getValue(latInput);
    const lon = coordinateInput.getValue(lonInput);

    electron.ipcRenderer.send('update-location-sub-window', lat, lon);

}

exports.updateMapWindow = updateMapWindow;

exports.prepareUI = (updateFunction) => {

    /* Prepare scale factor for drawing sunrise/sunset lines */

    scaleFactor = 1;

    if (Object.prototype.hasOwnProperty.call(window, 'devicePixelRatio')) {

        if (window.devicePixelRatio > 1) {

            scaleFactor = window.devicePixelRatio;

        }

    }

    /* Co-ordinate inputs */

    latInput = coordinateInput.create('coord-lat-input', true, true, () => {

        updateMapWindow();
        updateFunction();

    });

    lonInput = coordinateInput.create('coord-lon-input', false, true, () => {

        updateMapWindow();
        updateFunction();

    });

    /* Define the next elements which tab navigation would jump to. This allows inputs to know whether or not to start from the final field if shift-tabbed to */

    const lonTextInput = coordinateInput.getTextInput(lonInput);
    coordinateInput.setNextElements(latInput, [lonTextInput]);
    coordinateInput.setNextElements(lonInput, [mapButton]);

    coordinateInput.setValue(latInput, 0, 0, true);
    coordinateInput.setValue(lonInput, 0, 0, true);

    /* Interval inputs */

    sunriseBeforeIntervalInput = sunIntervalInput.create('sunrise-before-interval-input', false, updateFunction);
    sunriseAfterIntervalInput = sunIntervalInput.create('sunrise-after-interval-input', false, updateFunction);

    sunsetBeforeIntervalInput = sunIntervalInput.create('sunset-before-interval-input', false, updateFunction);
    sunsetAfterIntervalInput = sunIntervalInput.create('sunset-after-interval-input', false, updateFunction);

    sunIntervalInput.setValue(sunriseBeforeIntervalInput, 60);
    sunIntervalInput.setValue(sunriseAfterIntervalInput, 60);
    sunIntervalInput.setValue(sunsetBeforeIntervalInput, 60);
    sunIntervalInput.setValue(sunsetAfterIntervalInput, 60);

    /* Rounding input */

    sunRoundingInput = roundingInput.create('sun-rounding-input', updateFunction);

    roundingInput.setValue(sunRoundingInput, 5);

    /* Prepare other UI */

    sunModeSelect.addEventListener('change', updateSunUI);

    mapButton.addEventListener('click', () => {

        if (!navigator.onLine) {

            console.error('Cannot open map view. No internet connection');

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Cannot open map view',
                message: 'Cannot open map due to lack of internet connection. Check your connection and try again.'
            });

            return;

        }

        const lat = coordinateInput.getValue(latInput);
        const lon = coordinateInput.getValue(lonInput);

        electron.ipcRenderer.send('open-map-window', lat, lon);

    });

};

exports.usingSunSchedule = () => {

    return sunTab.classList.contains('active');

};

exports.getMode = () => {

    return parseInt(sunModeSelect.value);

};

exports.getBeforeSunriseMins = () => {

    return sunIntervalInput.getValue(sunriseBeforeIntervalInput);

};

exports.getAfterSunriseMins = () => {

    return sunIntervalInput.getValue(sunriseAfterIntervalInput);

};

exports.getBeforeSunsetMins = () => {

    return sunIntervalInput.getValue(sunsetBeforeIntervalInput);

};

exports.getAfterSunsetMins = () => {

    return sunIntervalInput.getValue(sunsetAfterIntervalInput);

};

function getSunriseSunset () {

    const d = firstRecordingDateCheckbox.checked ? new Date(firstRecordingDateInput.value) : new Date();

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    const latValue = coordinateInput.getValue(latInput);
    const latDegrees = latValue[0];
    const latHundredths = latValue[1];
    const latDirection = latValue[2];

    const lonValue = coordinateInput.getValue(lonInput);
    const lonDegrees = lonValue[0];
    const lonHundredths = lonValue[1];
    const lonDirection = lonValue[2];

    const sunDefinitionIndex = ipcRenderer.sendSync('request-sun-definition-index');

    return calculateSunriseSunset.calculate(sunDefinitionIndex, year, month, day, latDegrees, latHundredths, latDirection, lonDegrees, lonHundredths, lonDirection);

}

function drawPeriod (startMins, endMins) {

    sunContext.fillStyle = '#FF0000';

    /* width / 1440 minutes */
    const recX = startMins * sunCanvas.width / constants.MINUTES_IN_DAY;
    const recLen = (endMins - startMins) * sunCanvas.width / constants.MINUTES_IN_DAY;

    sunContext.fillRect(Math.round(recX), 0, Math.round(recLen), sunCanvas.height);

}

function updateCanvas (trend, sunriseMins, sunsetMins) {

    const roundingMins = roundingInput.getValue(sunRoundingInput);

    let roundedSunriseMins = roundingMins > 0 ? roundingMins * Math.round(sunriseMins / roundingMins) : sunriseMins;
    let roundedSunsetMins = roundingMins > 0 ? roundingMins * Math.round(sunsetMins / roundingMins) : sunsetMins;

    const offset = timeHandler.getTimeZoneOffset();

    roundedSunriseMins = (constants.MINUTES_IN_DAY + roundedSunriseMins + offset) % constants.MINUTES_IN_DAY;
    roundedSunsetMins = (constants.MINUTES_IN_DAY + roundedSunsetMins + offset) % constants.MINUTES_IN_DAY;

    const sunriseX = Math.round(roundedSunriseMins * sunCanvas.width / constants.MINUTES_IN_DAY);
    const sunsetX = Math.round(roundedSunsetMins * sunCanvas.width / constants.MINUTES_IN_DAY);

    /* Draw grey area to represent the night */

    sunContext.clearRect(0, 0, sunCanvas.width, sunCanvas.height);

    sunContext.fillStyle = '#C3C3C3';

    if (ui.isNightMode()) {

        sunContext.fillRect(0, 0, sunCanvas.width, sunCanvas.height);

        sunContext.fillStyle = '#000000';

    }

    if (roundedSunriseMins === roundedSunsetMins) {

        if (trend === constants.DAY_SHORTER_THAN_NIGHT) {

            sunContext.fillRect(0, 0, sunCanvas.width, sunCanvas.height);

        }

    } else if (roundedSunriseMins < roundedSunsetMins) {

        sunContext.fillRect(sunsetX, 0, sunCanvas.width - sunsetX, sunCanvas.height);
        sunContext.fillRect(0, 0, sunriseX, sunCanvas.height);

    } else {

        sunContext.fillRect(sunsetX, 0, sunriseX - sunsetX, sunCanvas.height);

    }

    /* Draw recording periods */

    const recordingPeriods = getRecordingPeriods();

    for (let i = 0; i < recordingPeriods.length; i++) {

        const startMins = recordingPeriods[i].startMins;
        let endMins = recordingPeriods[i].endMins;
        endMins = endMins === 0 ? constants.MINUTES_IN_DAY : endMins;

        if (startMins > endMins) {

            drawPeriod(startMins, constants.MINUTES_IN_DAY);
            drawPeriod(0, endMins);

        } else if (startMins === endMins) {

            drawPeriod(0, constants.MINUTES_IN_DAY);

        } else {

            drawPeriod(startMins, endMins);

        }

    }

    /* Draw sunrise and sunset markers */

    sunContext.fillStyle = '#B30000';
    sunContext.fillRect(Math.floor(sunriseX), 0, 2 * scaleFactor, sunCanvas.height);
    sunContext.fillRect(Math.floor(sunsetX), 0, 2 * scaleFactor, sunCanvas.height);

}

function updateSunUI () {

    updateSunRecordingMode();

    const [solution, trend, sunrise, sunset] = getSunriseSunset();

    updateCanvas(trend, sunrise, sunset);

}

exports.updateSunUI = updateSunUI;

function updateSunRecordingMode () {

    const mode = parseInt(sunModeSelect.value);

    switch (mode) {

    case constants.MODE_BEFORE_SUNRISE_AFTER_SUNRISE:
        sunIntervalInput.setEnabled(sunriseBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunriseAfterIntervalInput, true);

        sunIntervalInput.setEnabled(sunsetBeforeIntervalInput, false);
        sunIntervalInput.setEnabled(sunsetAfterIntervalInput, false);

        break;

    case constants.MODE_BEFORE_SUNSET_AFTER_SUNSET:
        sunIntervalInput.setEnabled(sunriseBeforeIntervalInput, false);
        sunIntervalInput.setEnabled(sunriseAfterIntervalInput, false);

        sunIntervalInput.setEnabled(sunsetBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunsetAfterIntervalInput, true);

        break;

    case constants.MODE_BEFORE_BOTH_AFTER_BOTH:
        sunIntervalInput.setEnabled(sunriseBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunriseAfterIntervalInput, true);

        sunIntervalInput.setEnabled(sunsetBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunsetAfterIntervalInput, true);

        break;

    case constants.MODE_BEFORE_SUNSET_AFTER_SUNRISE:
        sunIntervalInput.setEnabled(sunriseBeforeIntervalInput, false);
        sunIntervalInput.setEnabled(sunriseAfterIntervalInput, true);

        sunIntervalInput.setEnabled(sunsetBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunsetAfterIntervalInput, false);

        break;

    case constants.MODE_BEFORE_SUNRISE_AFTER_SUNSET:
        sunIntervalInput.setEnabled(sunriseBeforeIntervalInput, true);
        sunIntervalInput.setEnabled(sunriseAfterIntervalInput, false);

        sunIntervalInput.setEnabled(sunsetBeforeIntervalInput, false);
        sunIntervalInput.setEnabled(sunsetAfterIntervalInput, true);

        break;

    }

}

function getRecordingPeriods () {

    const [solution, trend, sunriseMins, sunsetMins] = getSunriseSunset();

    const sunMode = parseInt(sunModeSelect.value);

    const roundingMins = roundingInput.getValue(sunRoundingInput);

    const sunriseBeforeMins = sunIntervalInput.getValue(sunriseBeforeIntervalInput);
    const sunriseAfterMins = sunIntervalInput.getValue(sunriseAfterIntervalInput);
    const sunsetBeforeMins = sunIntervalInput.getValue(sunsetBeforeIntervalInput);
    const sunsetAfterMins = sunIntervalInput.getValue(sunsetAfterIntervalInput);

    const MINIMUM_RECORDING_GAP = Math.max(constants.MINIMUM_SUN_RECORDING_GAP, constants.SUN_RECORDING_GAP_MULTIPLIER * roundingMins);

    const MAXIMUM_RECORDING_DURATION = constants.MINUTES_IN_DAY - MINIMUM_RECORDING_GAP;

    // Calculate rounded sunrise and sunset minutes

    let roundedSunriseMins = roundingMins > 0 ? roundingMins * Math.round(sunriseMins / roundingMins) : sunriseMins;
    let roundedSunsetMins = roundingMins > 0 ? roundingMins * Math.round(sunsetMins / roundingMins) : sunsetMins;

    // Correct to local time

    const offset = timeHandler.getTimeZoneOffset();

    roundedSunriseMins += offset;
    roundedSunsetMins += offset;

    if (roundedSunriseMins < 0) roundedSunriseMins += constants.MINUTES_IN_DAY;
    if (roundedSunsetMins < 0) roundedSunsetMins += constants.MINUTES_IN_DAY;

    roundedSunriseMins = roundedSunriseMins % constants.MINUTES_IN_DAY;
    roundedSunsetMins = roundedSunsetMins % constants.MINUTES_IN_DAY;

    // Calculate intervals before and after sunrise and sunset

    const beforeSunrise = (constants.MINUTES_IN_DAY + roundedSunriseMins - sunriseBeforeMins) % constants.MINUTES_IN_DAY;
    const afterSunrise = (constants.MINUTES_IN_DAY + roundedSunriseMins + sunriseAfterMins) % constants.MINUTES_IN_DAY;
    const beforeSunset = (constants.MINUTES_IN_DAY + roundedSunsetMins - sunsetBeforeMins) % constants.MINUTES_IN_DAY;
    const afterSunset = (constants.MINUTES_IN_DAY + roundedSunsetMins + sunsetAfterMins) % constants.MINUTES_IN_DAY;

    // Calculate sunrise and sunset recording periods

    let timePeriods = [];

    if (sunMode === constants.MODE_BEFORE_SUNRISE_AFTER_SUNRISE || sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH) {

        if (sunriseBeforeMins > 0 || sunriseAfterMins > 0) timePeriods = scheduleEditor.addTime(beforeSunrise, afterSunrise, timePeriods);

    }

    if (sunMode === constants.MODE_BEFORE_SUNSET_AFTER_SUNSET || sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH) {

        if (sunsetBeforeMins > 0 || sunsetAfterMins > 0) timePeriods = scheduleEditor.addTime(beforeSunset, afterSunset, timePeriods);

    }

    if (sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH) {

        if (timePeriods.length === 1) {

            const duration = timePeriods[0].endMins <= timePeriods[0].startMins ? constants.MINUTES_IN_DAY + timePeriods[0].endMins - timePeriods[0].startMins : timePeriods[0].endMins - timePeriods[0].startMins;

            if (duration > MAXIMUM_RECORDING_DURATION) timePeriods = scheduleEditor.addTime(timePeriods[0].startMins, (timePeriods[0].startMins + MAXIMUM_RECORDING_DURATION) % constants.MINUTES_IN_DAY, []);

        } else if (timePeriods.length === 2) {

            const gapFromFirstPeriodToSecondPeriod = timePeriods[1].startMins - timePeriods[0].endMins;

            const gapFromSecondPeriodsToFirstPeriod = timePeriods[1].endMins < timePeriods[1].startMins ? timePeriods[0].startMins - timePeriods[1].endMins : constants.MINUTES_IN_DAY + timePeriods[0].startMins - timePeriods[1].endMins;

            if (gapFromFirstPeriodToSecondPeriod >= gapFromSecondPeriodsToFirstPeriod && gapFromFirstPeriodToSecondPeriod < MINIMUM_RECORDING_GAP) {

                let newTimePeriods = scheduleEditor.addTime(timePeriods[1].startMins, timePeriods[1].endMins, []);

                newTimePeriods = scheduleEditor.addTime(timePeriods[0].startMins, (constants.MINUTES_IN_DAY + timePeriods[0].endMins - MINIMUM_RECORDING_GAP + gapFromFirstPeriodToSecondPeriod) % constants.MINUTES_IN_DAY, newTimePeriods);

                timePeriods = newTimePeriods;

            } else if (gapFromSecondPeriodsToFirstPeriod >= gapFromFirstPeriodToSecondPeriod && gapFromSecondPeriodsToFirstPeriod < MINIMUM_RECORDING_GAP) {

                let newTimePeriods = scheduleEditor.addTime(timePeriods[0].startMins, timePeriods[0].endMins, []);

                newTimePeriods = scheduleEditor.addTime(timePeriods[1].startMins, (constants.MINUTES_IN_DAY + timePeriods[1].endMins - MINIMUM_RECORDING_GAP + gapFromSecondPeriodsToFirstPeriod) % constants.MINUTES_IN_DAY, newTimePeriods);

                timePeriods = newTimePeriods;

            }

        }

    }

    if (sunMode === constants.MODE_BEFORE_SUNSET_AFTER_SUNRISE) {

        let timeFromSunsetToSunrise;

        if (roundedSunriseMins === roundedSunsetMins) {

            timeFromSunsetToSunrise = trend === constants.DAY_SHORTER_THAN_NIGHT ? constants.MINUTES_IN_DAY : 0;

        } else {

            timeFromSunsetToSunrise = roundedSunriseMins < roundedSunsetMins ? constants.MINUTES_IN_DAY + roundedSunriseMins - roundedSunsetMins : roundedSunriseMins - roundedSunsetMins;

        }

        const duration = timeFromSunsetToSunrise + sunsetBeforeMins + sunriseAfterMins;

        if (duration > 0) timePeriods = scheduleEditor.addTime(beforeSunset, duration <= MAXIMUM_RECORDING_DURATION ? afterSunrise : (beforeSunset + MAXIMUM_RECORDING_DURATION) % constants.MINUTES_IN_DAY, timePeriods);

    }

    if (sunMode === constants.MODE_BEFORE_SUNRISE_AFTER_SUNSET) {

        let timeFromSunriseToSunset;

        if (roundedSunriseMins === roundedSunsetMins) {

            timeFromSunriseToSunset = trend === constants.DAY_LONGER_THAN_NIGHT ? constants.MINUTES_IN_DAY : 0;

        } else {

            timeFromSunriseToSunset = roundedSunsetMins < roundedSunriseMins ? constants.MINUTES_IN_DAY + roundedSunsetMins - roundedSunriseMins : roundedSunsetMins - roundedSunriseMins;

        }

        const duration = timeFromSunriseToSunset + sunriseBeforeMins + sunsetAfterMins;

        if (duration > 0) timePeriods = scheduleEditor.addTime(beforeSunrise, duration <= MAXIMUM_RECORDING_DURATION ? afterSunset : (beforeSunrise + MAXIMUM_RECORDING_DURATION) % constants.MINUTES_IN_DAY, timePeriods);

    }

    return timePeriods;

}

exports.getRecordingPeriods = getRecordingPeriods;
