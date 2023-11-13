/****************************************************************************
 * scheduleBar.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global window, document */

const ui = require('./ui.js');
const timeHandler = require('./timeHandler.js');
const schedule = require('./schedule/schedule.js');
const constants = require('./constants.js');

const timeCanvas = document.getElementById('time-canvas');
const timeContext = timeCanvas.getContext('2d');
const labelCanvas = document.getElementById('label-canvas');
const labelContext = labelCanvas.getContext('2d');

let clickCallback;

let selectedPeriod = null;

/* Function to rescale */

function rescale (canvas) {

    let scaleFactor = 1;

    if (Object.prototype.hasOwnProperty.call(window, 'devicePixelRatio')) {

        if (window.devicePixelRatio > 1) {

            scaleFactor = window.devicePixelRatio;

        }

    }

    if (scaleFactor > 1) {

        canvas.width = canvas.width * scaleFactor;
        canvas.height = canvas.height * scaleFactor;

        canvas.style.width = canvas.width / scaleFactor + 'px';
        canvas.style.height = canvas.height / scaleFactor + 'px';

    }

}

function drawPeriod (startMins, endMins, timeCanvas) {

    /* width / 1440 minutes */
    const recX = startMins * timeCanvas.width / 1440;
    const recLen = (endMins - startMins) * timeCanvas.width / 1440;

    timeContext.fillRect(recX, 0, recLen, timeCanvas.height);

}

function updateCanvas () {

    let timePeriods = schedule.getTimePeriods();

    const timeZoneMode = ui.getTimeZoneMode();

    if (timeZoneMode !== constants.TIME_ZONE_MODE_UTC) {

        timePeriods = timeHandler.shiftTimePeriods(timePeriods, false);

    }

    const currentTimeDate = new Date();

    timeContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);

    for (let i = 0; i < timePeriods.length; i++) {

        const startMins = timePeriods[i].startMins;
        let endMins = timePeriods[i].endMins;
        endMins = endMins === 0 ? 1440 : endMins;

        if (selectedPeriod !== null && (selectedPeriod.startMins === startMins && selectedPeriod.endMins === endMins)) {

            timeContext.fillStyle = '#007BFF';

        } else {

            timeContext.fillStyle = '#FF0000';

        }

        if (startMins > endMins) {

            drawPeriod(startMins, 1440, timeCanvas);
            drawPeriod(0, endMins, timeCanvas);

        } else if (startMins === endMins) {

            drawPeriod(0, 1440, timeCanvas);

        } else {

            drawPeriod(startMins, endMins, timeCanvas);

        }

    }

    /* 6am, midday and 6pm markers */

    if (ui.isNightMode()) {

        timeContext.fillStyle = '#FFFFFF';

    } else {

        timeContext.fillStyle = '#000000';

    }

    timeContext.fillRect(0.25 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.5 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.75 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);

    let currentMins = (currentTimeDate.getUTCHours() * constants.MINUTES_IN_HOUR) + currentTimeDate.getUTCMinutes();

    if (timeZoneMode !== constants.TIME_ZONE_MODE_UTC) {

        currentMins += timeHandler.getTimeZoneOffset();

    }

    const currentX = currentMins * timeCanvas.width / 1440;

    timeContext.fillStyle = '#00AF00';
    timeContext.fillRect((currentX - 1), 0, 0.004 * timeCanvas.width, timeCanvas.height);

}

exports.updateCanvas = updateCanvas;

/* Regularly update time period canvas so green line reflects current time */

function updateCanvasTimer () {

    updateCanvas();
    setTimeout(updateCanvasTimer, 60000);

}

/* Update which period is selected when schedule bar is clicked */

function updateSelectedPeriod (event) {

    let timePeriods = schedule.getTimePeriods();

    /* If there's only one possible time period and it covers the entire length of the schedule, don't bother with the full check */

    if (timePeriods.length === 1 && timePeriods[0].startMins === timePeriods[0].endMins) {

        const selectedIndex = 0;

        if (clickCallback) {

            clickCallback(selectedIndex);

        }

        return;

    }

    const rect = timeCanvas.getBoundingClientRect();
    const clickMins = (event.clientX - rect.left) / timeCanvas.width * 1440;

    if (ui.getTimeZoneMode() !== constants.TIME_ZONE_MODE_UTC) {

        timePeriods = timeHandler.shiftTimePeriods(timePeriods, false);

    }

    let selectedIndex = -1;

    for (let i = 0; i < timePeriods.length; i++) {

        const startMins = timePeriods[i].startMins;
        const endMins = timePeriods[i].endMins;

        if (startMins > endMins) {

            if ((clickMins >= startMins && clickMins < 1440) || (clickMins >= 0 && clickMins < endMins)) {

                selectedIndex = i;

            }

        } else {

            if (clickMins >= startMins && clickMins < endMins) {

                selectedIndex = i;

            }

        }

    }

    if (clickCallback) {

        clickCallback(selectedIndex);

    }

}

/* Set clicked period to specific index */

exports.setSelectedPeriod = (period) => {

    selectedPeriod = period;
    updateCanvas();

};

function clearSelectedPeriod () {

    selectedPeriod = null;
    updateCanvas();

};

exports.clearSelectedPeriod = clearSelectedPeriod;

/* Draw labels below time period canvas */

function drawTimeLabels () {

    const fontSize = 0.32 * timeCanvas.height;

    labelContext.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    labelContext.font = fontSize + 'pt Helvetica';

    if (ui.isNightMode()) {

        labelContext.fillStyle = '#FFFFFF';

    } else {

        labelContext.fillStyle = '#000000';

    }

    labelContext.fillText('00:00', 0, fontSize);
    labelContext.fillText('06:00', 0.25 * timeCanvas.width, fontSize);
    labelContext.fillText('12:00', 0.5 * timeCanvas.width, fontSize);
    labelContext.fillText('18:00', 0.751 * timeCanvas.width, fontSize);
    labelContext.fillText('24:00', timeCanvas.width, fontSize);

}

exports.drawTimeLabels = drawTimeLabels;

exports.prepareScheduleCanvas = (callback) => {

    clickCallback = callback;
    timeCanvas.addEventListener('click', updateSelectedPeriod);

    /* Rescale for resolution of screen */
    rescale(timeCanvas);
    rescale(labelCanvas);

    /* Draw labels below timeline */
    drawTimeLabels();

    /* Start recursive loop which keep canvas up to date */
    updateCanvasTimer();

};

exports.setSchedule = (timePeriods) => {

    let tps = timePeriods;

    tps = timeHandler.sortPeriods(tps);

    schedule.setTimePeriods(tps);
    updateCanvas();

};

exports.getTimePeriods = schedule.getTimePeriods;
exports.getTimePeriodsNoWrap = schedule.getTimePeriodsNoWrap;
exports.MAX_PERIODS = schedule.MAX_PERIODS;
