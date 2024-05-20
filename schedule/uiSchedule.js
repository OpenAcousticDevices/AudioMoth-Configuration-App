/****************************************************************************
 * uiSchedule.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');

const constants = require('../constants.js');
const ui = require('../ui.js');
const scheduleEditor = require('./scheduleEditor.js');
const uiScheduleEditor = require('./uiScheduleEditor.js');
const timeHandler = require('../timeHandler.js');

const firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');
const firstRecordingDateLabel = document.getElementById('first-date-label');
const firstRecordingDateInput = document.getElementById('first-date-input');

const lastRecordingDateCheckbox = document.getElementById('last-date-checkbox');
const lastRecordingDateLabel = document.getElementById('last-date-label');
const lastRecordingDateInput = document.getElementById('last-date-input');

const sunriseIntervalLabel = document.getElementById('sunrise-interval-label');
const sunsetIntervalLabel = document.getElementById('sunset-interval-label');
const roundingLabel = document.getElementById('rounding-label');

const sunModeSelect = document.getElementById('sun-mode-select');

const sunCanvas = document.getElementById('sun-canvas');

const manualTabButton = document.getElementById('manual-tab-button');
const sunTabButton = document.getElementById('sun-tab-button');
const sunTabButtontext = document.getElementById('sun-tab-button-text');

/* Sun input controls */

const sunIntervalInput = require('./sunIntervalInput.js');
const coordinateInput = require('./coordinateInput.js');
const roundingInput = require('./roundingInput.js');

/* Previous valid first/last recording dates */

let prevFirstDate = dateObjectToFormattedString(new Date());
let prevLastDate = dateObjectToFormattedString(new Date());

function dateObjectToFormattedString (d) {

    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    return d.getFullYear() + '-' + (month) + '-' + (day);

}

exports.updateTimeZoneStatus = () => {

    let timeZoneText = 'UTC';

    timeHandler.storeTimeZoneOffset();

    timeZoneText = timeHandler.getTimeZoneText();

    firstRecordingDateLabel.innerHTML = 'First recording date (' + timeZoneText + '):';
    lastRecordingDateLabel.innerHTML = 'Last recording date (' + timeZoneText + '):';

    uiScheduleEditor.disableRemoveTimeButton();

};

function startlastRecordingDateError (input) {

    if (input.disabled) {

        return;

    }

    input.style.border = '1px solid #0000ff';
    input.style.color = 'blue';

    setTimeout(() => {

        if (!input.disabled) {

            input.classList.remove('grey');

        }

        input.style.color = '';
        input.style.border = '';

    }, 1000);

}

function checkDateRange (input) {

    input.value = input.value < constants.MIN_FIRST_LAST_DATE ? constants.MIN_FIRST_LAST_DATE : input.value;
    input.value = input.value > constants.MAX_FIRST_LAST_DATE ? constants.MAX_FIRST_LAST_DATE : input.value;

}

function checkDates (startEnd) {

    firstRecordingDateInput.value = firstRecordingDateInput.value === '' ? prevFirstDate : firstRecordingDateInput.value;
    lastRecordingDateInput.value = lastRecordingDateInput.value === '' ? prevLastDate : lastRecordingDateInput.value;

    checkDateRange(startEnd === 0 ? firstRecordingDateInput : lastRecordingDateInput);

    if (firstRecordingDateInput.value > lastRecordingDateInput.value) {

        if (startEnd === 0) {

            lastRecordingDateInput.value = firstRecordingDateInput.value;
            startlastRecordingDateError(lastRecordingDateInput);

        } else if (startEnd === 1) {

            firstRecordingDateInput.value = lastRecordingDateInput.value;
            startlastRecordingDateError(firstRecordingDateInput);

        }

    }

    prevFirstDate = firstRecordingDateInput.value;
    prevLastDate = lastRecordingDateInput.value;

}

/* Enable/disable start date entry based on checkbox */

function updateFirstRecordingDateUI () {

    if (firstRecordingDateCheckbox.checked) {

        firstRecordingDateLabel.classList.remove('grey');
        firstRecordingDateInput.classList.remove('grey');
        firstRecordingDateInput.disabled = false;

    } else {

        firstRecordingDateLabel.classList.add('grey');
        firstRecordingDateInput.classList.add('grey');
        firstRecordingDateInput.disabled = true;

    }

}

/* Enable/disable start date entry based on checkbox */

function updateLastRecordingDateUI () {

    if (lastRecordingDateCheckbox.checked) {

        lastRecordingDateLabel.classList.remove('grey');
        lastRecordingDateInput.classList.remove('grey');
        lastRecordingDateInput.disabled = false;

    } else {

        lastRecordingDateLabel.classList.add('grey');
        lastRecordingDateInput.classList.add('grey');
        lastRecordingDateInput.disabled = true;

    }

}

exports.isFirstRecordingDateEnabled = () => {

    return firstRecordingDateCheckbox.checked;

};

exports.isLastRecordingDateEnabled = () => {

    return lastRecordingDateCheckbox.checked;

};

exports.getFirstRecordingDate = () => {

    return firstRecordingDateInput.value;

};

exports.getLastRecordingDate = () => {

    return lastRecordingDateInput.value;

};

exports.setFirstRecordingDate = (firstRecordingDateEnabled, firstRecordingDate) => {

    firstRecordingDateCheckbox.checked = firstRecordingDateEnabled;
    updateFirstRecordingDateUI();

    firstRecordingDateInput.value = firstRecordingDate;

    checkDates(0);

};

exports.setLastRecordingDate = (lastRecordingDateEnabled, lastRecordingDate) => {

    lastRecordingDateCheckbox.checked = lastRecordingDateEnabled;
    updateLastRecordingDateUI();

    lastRecordingDateInput.value = lastRecordingDate;

    checkDates(1);

};

electron.ipcRenderer.on('update-location', (e, latArray, lonArray) => {

    const latInput = document.getElementById('coord-lat-input');
    const lonInput = document.getElementById('coord-lon-input');

    coordinateInput.setValue(latInput, latArray[0], latArray[1], latArray[2]);
    coordinateInput.setValue(lonInput, lonArray[0], lonArray[1], lonArray[2]);

    sunTabButton.click();

});

exports.setSunSettings = (sunScheduleEnabled, latitude, longitude, sunMode, sunPeriods, sunRounding) => {

    const latInput = document.getElementById('coord-lat-input');
    const lonInput = document.getElementById('coord-lon-input');

    const latDegrees = latitude.degrees >= -90 && latitude.degrees <= 90 ? latitude.degrees : 0;
    const latHundredths = latitude.hundredths >= 0 && latitude.hundredths <= 9999 ? latitude.hundredths : 0;

    const lonDegrees = longitude.degrees >= -180 && longitude.degrees <= 180 ? longitude.degrees : 0;
    const lonHundredths = longitude.hundredths >= 0 && longitude.hundredths <= 9999 ? longitude.hundredths : 0;

    coordinateInput.setValue(latInput, latDegrees, latHundredths, latitude.positiveDirection);
    coordinateInput.setValue(lonInput, lonDegrees, lonHundredths, longitude.positiveDirection);

    sunModeSelect.value = sunMode;

    const sunriseBeforeIntervalInput = document.getElementById('sunrise-before-interval-input');
    const sunriseAfterIntervalInput = document.getElementById('sunrise-after-interval-input');

    const sunsetBeforeIntervalInput = document.getElementById('sunset-before-interval-input');
    const sunsetAfterIntervalInput = document.getElementById('sunset-after-interval-input');

    sunIntervalInput.setValue(sunriseBeforeIntervalInput, sunPeriods.sunriseBefore);
    sunIntervalInput.setValue(sunriseAfterIntervalInput, sunPeriods.sunriseAfter);
    sunIntervalInput.setValue(sunsetBeforeIntervalInput, sunPeriods.sunsetBefore);
    sunIntervalInput.setValue(sunsetAfterIntervalInput, sunPeriods.sunsetAfter);

    const sunRoundingInput = document.getElementById('sun-rounding-input');

    roundingInput.setValue(sunRoundingInput, sunRounding);

    if (sunScheduleEnabled) {

        sunTabButton.click();

    } else {

        manualTabButton.click();

    }

};

exports.getLatitude = () => {

    const latInput = document.getElementById('coord-lat-input');
    const lat = coordinateInput.getValue(latInput);

    return {
        degrees: lat[0],
        hundredths: lat[1],
        positiveDirection: lat[2]
    };

};

exports.getLongitude = () => {

    const lonInput = document.getElementById('coord-lon-input');
    const lon = coordinateInput.getValue(lonInput);

    return {
        degrees: lon[0],
        hundredths: lon[1],
        positiveDirection: lon[2]
    };

};

exports.getSunMode = () => {

    return parseInt(sunModeSelect.value);

};

exports.getSunPeriods = () => {

    const sunriseBeforeIntervalInput = document.getElementById('sunrise-before-interval-input');
    const sunriseAfterIntervalInput = document.getElementById('sunrise-after-interval-input');

    const sunsetBeforeIntervalInput = document.getElementById('sunset-before-interval-input');
    const sunsetAfterIntervalInput = document.getElementById('sunset-after-interval-input');

    return {
        sunriseBefore: sunIntervalInput.getValue(sunriseBeforeIntervalInput),
        sunriseAfter: sunIntervalInput.getValue(sunriseAfterIntervalInput),
        sunsetBefore: sunIntervalInput.getValue(sunsetBeforeIntervalInput),
        sunsetAfter: sunIntervalInput.getValue(sunsetAfterIntervalInput)
    };

};

exports.getSunRounding = () => {

    const sunRoundingInput = document.getElementById('sun-rounding-input');
    return roundingInput.getValue(sunRoundingInput);

};

exports.updateTimeList = uiScheduleEditor.updateTimeList;

function updateSunDefinitionUI (index) {

    switch (index) {

    case constants.SUNRISE_AND_SUNSET:
        sunModeSelect.options[0].innerHTML = 'Sunrise';
        sunModeSelect.options[1].innerHTML = 'Sunset';
        sunModeSelect.options[2].innerHTML = 'Sunrise and Sunset';
        sunModeSelect.options[3].innerHTML = 'Sunset to Sunrise';
        sunModeSelect.options[4].innerHTML = 'Sunrise to Sunset';

        sunriseIntervalLabel.innerHTML = 'Sunrise interval - before and after (mins):';
        sunsetIntervalLabel.innerHTML = 'Sunset interval - before and after (mins):';
        roundingLabel.innerHTML = 'Sunrise/sunset rounding (mins):';

        sunTabButtontext.innerHTML = 'Sunrise/sunset';

        break;

    case constants.CIVIL_DAWN_AND_DUSK:
        sunModeSelect.options[0].innerHTML = 'Civil Dawn';
        sunModeSelect.options[1].innerHTML = 'Civil Dusk';
        sunModeSelect.options[2].innerHTML = 'Civil Dawn and Dusk';
        sunModeSelect.options[3].innerHTML = 'Civil Dusk to Dawn';
        sunModeSelect.options[4].innerHTML = 'Civil Dawn to Dusk';

        sunriseIntervalLabel.innerHTML = 'Dawn interval - before and after (mins):';
        sunsetIntervalLabel.innerHTML = 'Dusk interval - before and after (mins):';
        roundingLabel.innerHTML = 'Dawn/dusk rounding (mins):';

        sunTabButtontext.innerHTML = 'Dawn/dusk';

        break;

    case constants.NAUTICAL_DAWN_AND_DUSK:
        sunModeSelect.options[0].innerHTML = 'Nautical Dawn';
        sunModeSelect.options[1].innerHTML = 'Nautical Dusk';
        sunModeSelect.options[2].innerHTML = 'Nautical Dawn and Dusk';
        sunModeSelect.options[3].innerHTML = 'Nautical Dusk to Dawn';
        sunModeSelect.options[4].innerHTML = 'Nautical Dawn to Dusk';

        sunriseIntervalLabel.innerHTML = 'Dawn interval - before and after (mins):';
        sunsetIntervalLabel.innerHTML = 'Dusk interval - before and after (mins):';
        roundingLabel.innerHTML = 'Dawn/dusk rounding (mins):';

        sunTabButtontext.innerHTML = 'Dawn/dusk';

        break;

    case constants.ASTRONOMICAL_DAWN_AND_DUSK:
        sunModeSelect.options[0].innerHTML = 'Astro Dawn';
        sunModeSelect.options[1].innerHTML = 'Astro Dusk';
        sunModeSelect.options[2].innerHTML = 'Astro Dawn and Dusk';
        sunModeSelect.options[3].innerHTML = 'Astro Dusk to Dawn';
        sunModeSelect.options[4].innerHTML = 'Astro Dawn to Dusk';

        sunriseIntervalLabel.innerHTML = 'Dawn interval - before and after (mins):';
        sunsetIntervalLabel.innerHTML = 'Dusk interval - before and after (mins):';
        roundingLabel.innerHTML = 'Dawn/dusk rounding (mins):';

        sunTabButtontext.innerHTML = 'Dawn/dusk';

        break;

    }

}

exports.updateSunDefinitionUI = updateSunDefinitionUI;

/* Prepare UI */

exports.prepareUI = (changeFunction) => {

    const today = new Date();
    const todayString = ui.formatDateString(today);

    firstRecordingDateInput.value = todayString;
    lastRecordingDateInput.value = todayString;

    updateFirstRecordingDateUI();
    updateLastRecordingDateUI();

    uiScheduleEditor.prepareUI(changeFunction);

    /* Set up time display */

    ui.disableTimeDisplay();
    ui.showTime();

    /* Add event listeners for changing schedule modes */

    manualTabButton.addEventListener('click', () => {

        sunCanvas.style.display = 'none';
        ui.update();
        changeFunction();

    });

    sunTabButton.addEventListener('click', () => {

        sunCanvas.style.display = '';
        ui.update();
        changeFunction();

    });

    sunModeSelect.addEventListener('change', changeFunction);

    electron.ipcRenderer.on('sun-definition-change', (e, index) => {

        updateSunDefinitionUI(index);

        ui.update();
        changeFunction();

    });

    /* First/last recording listeners */

    firstRecordingDateInput.addEventListener('focusout', () => {

        checkDates(0);

        /* Slight delay to handle if you go from changing the start date to unchecking the first date checkbox */

        setTimeout(() => {

            if (firstRecordingDateCheckbox.checked) {

                ui.update();
                changeFunction();

            }

        }, 100);

    });

    lastRecordingDateInput.addEventListener('focusout', () => {

        checkDates(1);

    });

    firstRecordingDateCheckbox.addEventListener('change', () => {

        ui.update();
        updateFirstRecordingDateUI();
        changeFunction();

    });

    lastRecordingDateCheckbox.addEventListener('change', () => {

        updateLastRecordingDateUI();

    });

    firstRecordingDateLabel.addEventListener('click', () => {

        firstRecordingDateCheckbox.toggleAttribute('checked');
        updateFirstRecordingDateUI();
        changeFunction();

    });

    lastRecordingDateLabel.addEventListener('click', () => {

        lastRecordingDateCheckbox.toggleAttribute('checked');
        updateLastRecordingDateUI();

    });

};

exports.addTime = scheduleEditor.addTime;
