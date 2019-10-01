/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/*global window, document, dialog*/

var timeHandler = require('./timePeriods.js');
var lifeDisplay = require('./lifeDisplay.js');

var strftime = require('strftime').utc();

var electron = require('electron');
var menu = electron.remote.Menu;
var clipboard = electron.remote.clipboard;

/* UI components */

var applicationMenu = menu.getApplicationMenu();

var timezoneLabel = document.getElementById('timezone-label');

var idDisplay = document.getElementById('id-display');
var idLabel = document.getElementById('id-label');

var firmwareDisplay = document.getElementById('firmware-display');
var firmwareLabel = document.getElementById('firmware-label');

var timeDisplay = document.getElementById('time-display');

var batteryDisplay = document.getElementById('battery-display');
var batteryLabel = document.getElementById('battery-label');

var startTimeInput = document.getElementById('start-time-input');
var endTimeInput = document.getElementById('end-time-input');

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

var timeList = document.getElementById('time-list');
var removeTimeButton = document.getElementById('remove-time-button');

var minRecordingDuration = 1;
var maxRecordingDuration = 43200;
var minSleepDuration = 0;
var maxSleepDuration = 43200;

var configureButton = document.getElementById('configure-button');

var nightMode = false;
var localTime = false;

var deviceDate = new Date(0);

/* Function to rescale */

function rescale(canvas) {

    var scaleFactor = 1;

    if (window.hasOwnProperty('devicePixelRatio')) {
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

/* Rescale for resolution of screen */

var timeCanvas = document.getElementById("time-canvas");
var timeContext = timeCanvas.getContext("2d");

rescale(timeCanvas);

var labelCanvas = document.getElementById("label-canvas");
var labelContext = labelCanvas.getContext("2d");

rescale(labelCanvas);

function isLocalTime() {

    return localTime;

}

exports.isLocalTime = isLocalTime;

function setLocalTime(lTime) {

    localTime = lTime;
    applicationMenu.getMenuItemById("localTime").checked = localTime;

}

function calculateTimezoneOffsetMins() {

    var currentDate = new Date();
    return (-1 * currentDate.getTimezoneOffset());

}

exports.calculateTimezoneOffsetMins = calculateTimezoneOffsetMins;

function calculateTimezoneOffsetHours() {

    return (calculateTimezoneOffsetMins() / 60);

}

exports.calculateTimezoneOffsetHours = calculateTimezoneOffsetHours;

/* Update time period canvas */

function updateCanvas() {

    var timePeriods, i, startMins, endMins, recX, recLen, currentTimeDate, currentMins, currentX;

    timePeriods = timeHandler.getTimePeriods();

    if (localTime) {

        timePeriods = timeHandler.convertTimePeriodsToLocal(timePeriods);

    }

    currentTimeDate = new Date();

    timeContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);

    for (i = 0; i < timePeriods.length; i += 1) {

        startMins = timePeriods[i].startMins;
        endMins = timePeriods[i].endMins;

        /* width / 1440 minutes */
        recX = startMins * timeCanvas.width / 1440;
        recLen = (endMins - startMins) * timeCanvas.width / 1440;

        timeContext.fillStyle = "#FF0000";
        timeContext.fillRect(recX, 0, recLen, timeCanvas.height);

    }

    /* 6am, midday and 6pm markers */

    if (nightMode) {

        timeContext.fillStyle = "#FFFFFF";

    } else {

        timeContext.fillStyle = "#000000";

    }

    timeContext.fillRect(0.25 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.5 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.75 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);

    if (isLocalTime()) {

        currentMins = (currentTimeDate.getHours() * 60) + currentTimeDate.getMinutes();

    } else {

        currentMins = (currentTimeDate.getUTCHours() * 60) + currentTimeDate.getUTCMinutes();

    }

    currentX = currentMins * timeCanvas.width / 1440;

    timeContext.fillStyle = "#00AF00";
    timeContext.fillRect((currentX - 1), 0, 0.004 * timeCanvas.width, timeCanvas.height);

}

exports.updateCanvas = updateCanvas;

/* Regularly update time period canvas so green line reflects current time */

function updateCanvasTimer() {

    updateCanvas();
    setTimeout(updateCanvasTimer, 60000);

}

exports.updateCanvasTimer = updateCanvasTimer;

/* Function to generate the time string */

function showTime() {

    var timezoneOffset, strftimeUTC;

    timezoneOffset = 0;

    if (isLocalTime()) {

        timezoneOffset = calculateTimezoneOffsetMins();

    }

    strftimeUTC = strftime.timezone(timezoneOffset);

    timeDisplay.textContent = strftimeUTC("%H:%M:%S %d/%m/%Y", deviceDate);

}

exports.showTime = showTime;

/* Run all UI update functions */

function updateUI() {

    timeHandler.updateTimeList();
    updateCanvas();
    lifeDisplay.updateLifeDisplay();
    showTime();

    /* If no time period is selected, disable the removal button */
    removeTimeButton.disabled = (timeList.value === null || timeList.value === "");

}

exports.updateUI = updateUI;

/* Draw labels below time period canvas */

function drawTimeLabels() {

    var fontSize = 0.28 * timeCanvas.height;

    labelContext.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    labelContext.font = fontSize + "pt Helvetica";

    if (nightMode) {

        labelContext.fillStyle = "#FFFFFF";

    } else {

        labelContext.fillStyle = "#000000";

    }

    labelContext.fillText("00:00", 0, fontSize);
    labelContext.fillText("06:00", 0.225 * timeCanvas.width, fontSize);
    labelContext.fillText("12:00", 0.475 * timeCanvas.width, fontSize);
    labelContext.fillText("18:00", 0.725 * timeCanvas.width, fontSize);
    labelContext.fillText("24:00", 0.95 * timeCanvas.width, fontSize);

}

exports.drawTimeLabels = drawTimeLabels;

/* Retrieve the radio button selected from a group of named buttons */

function getSelectedRadioValue(radioName) {
    return document.querySelector('input[name="' + radioName + '"]:checked').value;
}

exports.getSelectedRadioValue = getSelectedRadioValue;

/* Initialise device information displays */

function initialiseDisplay() {

    idDisplay.textContent = "0000000000000000";

    showTime();

    batteryDisplay.textContent = "0.0V";

    firmwareDisplay.textContent = "0.0.0";

}

exports.initialiseDisplay = initialiseDisplay;

/* Disable/enable device information display */

exports.disableDisplay = function () {

    timeDisplay.style.color = "lightgrey";

    timezoneLabel.style.color = "lightgrey";

    deviceDate = new Date(0);

    idLabel.style.color = "lightgrey";

    idDisplay.style.color = "lightgrey";

    firmwareLabel.style.color = "lightgrey";

    firmwareDisplay.style.color = "lightgrey";

    batteryLabel.style.color = "lightgrey";

    batteryDisplay.style.color = "lightgrey";

    configureButton.disabled = true;

    initialiseDisplay();

    applicationMenu.getMenuItemById("copyid").enabled = false;

};

exports.updateDate = function (date) {

    deviceDate = date;

};

exports.enableDisplay = function () {

    var textColor;

    if (nightMode) {

        textColor = "white";

    } else {

        textColor = "black";

    }

    timeDisplay.style.color = textColor;

    timezoneLabel.style.color = textColor;

    idLabel.style.color = textColor;

    idDisplay.style.color = textColor;

    firmwareLabel.style.color = textColor;

    firmwareDisplay.style.color = textColor;

    batteryLabel.style.color = textColor;

    batteryDisplay.style.color = textColor;

    configureButton.disabled = false;

    applicationMenu.getMenuItemById("copyid").enabled = true;

};

/* Insert retrieved values into device information display */

exports.updateIdDisplay = function (id) {

    if (id !== idDisplay.textContent) {

        idDisplay.textContent = id;

    }

};

exports.updateFirmwareDisplay = function (version) {

    if (version !== firmwareDisplay.value) {

        firmwareDisplay.textContent = version;

    }

};

exports.updateBatteryDisplay = function (batteryState) {

    batteryDisplay.textContent = batteryState;

};

/* Verify that an input value is between a max and min, notifying the user if this is not the case */

function inputIsCorrect(input, min, max) {

    var correct = true;

    if (input.value === "") {

        input.value = min;
        correct = false;

    } else if (input.value < min) {

        input.value = min;
        correct = false;

    } else if (input.value > max) {

        input.value = max;
        correct = false;

    }

    if (!correct) {

        input.style.border = "1px solid #ff0000";
        input.style.padding = "2px 1px";
        input.style.color = "red";

        setTimeout(function () {

            input.style.border = "";
            input.style.padding = "";
            input.style.color = "";

        }, 2500);

    }

    return correct;

}

/* Apply range checks to sleep and recording duration text boxes */

function checkInputs(callback) {

    var sleepDurationCorrect, recordingDurationCorrect;

    sleepDurationCorrect = inputIsCorrect(sleepDurationInput, minSleepDuration, maxSleepDuration);
    recordingDurationCorrect = inputIsCorrect(recordingDurationInput, minRecordingDuration, maxRecordingDuration);

    if (sleepDurationCorrect && recordingDurationCorrect) {

        callback();

    } else if (!sleepDurationCorrect) {

        dialog.showMessageBox({
            type: "warning",
            title: "Sleep length out of range.",
            message: "Please enter a sleep length in the range (" + minSleepDuration + " - " + maxSleepDuration + ")."
        });

    } else if (!recordingDurationCorrect) {

        dialog.showMessageBox({
            type: "warning",
            title: "Recording length out of range.",
            message: "Please enter a recording length in the range (" + minRecordingDuration + " - " + maxRecordingDuration + ")."
        });

    }

}

exports.checkInputs = checkInputs;

/* Verify that time inputs are in the correct format */

function timeInputIsCorrect(input) {

    var time, hours, mins, correct = true,
        patt = new RegExp("^[0-9]?[0-9]:[0-9]{2}$");

    /* Check input is in the format "00:00" */

    if (!patt.test(input.value)) {

        correct = false;

    } else {

        time = input.value.split(":");
        if (time.length !== 2) {

            correct = false;

        } else {

            hours = parseInt(time[0], 10);
            mins = parseInt(time[1], 10);

            if (hours < 0 || isNaN(hours)) {

                correct = false;

            } else if (mins > 59) {

                correct = false;

            } else if (mins < 0 || isNaN(mins)) {

                correct = false;

            }

        }

    }

    if (!correct) {

        input.style.border = "1px solid #ff0000";
        input.style.padding = "2px 1px";
        input.style.color = "red";

        setTimeout(function () {

            input.style.border = "";
            input.style.padding = "";
            input.style.color = "";

        }, 2500);

    }

    return correct;
}

/* Apply error/default styles to time textboxes */

function setTimeInputStyleError() {

    startTimeInput.value = "0:00";
    startTimeInput.style.border = "1px solid #ff0000";
    startTimeInput.style.padding = "2px 1px";
    startTimeInput.style.color = "red";

    endTimeInput.value = "24:00";
    endTimeInput.style.border = "1px solid #ff0000";
    endTimeInput.style.padding = "2px 1px";
    endTimeInput.style.color = "red";

}

function setTimeInputStyleDefault() {

    startTimeInput.style.border = "";
    startTimeInput.style.padding = "";
    startTimeInput.style.color = "";

    endTimeInput.style.border = "";
    endTimeInput.style.padding = "";
    endTimeInput.style.color = "";

}

exports.setTimeInputStyleError = setTimeInputStyleError;
exports.setTimeInputStyleDefault = setTimeInputStyleDefault;

/* Apply input validation on start and end recording time inputs */

exports.checkTimeInputs = function (callback) {

    if (timeInputIsCorrect(startTimeInput) && timeInputIsCorrect(endTimeInput)) {
        callback();
    }

};

/* Only allow the input of '0-9' and ':' in time textboxes */

function checkTimeKeypress(event) {
    var patt = new RegExp("^[0-9]|:$");
    if (!patt.test(event.key)) {
        event.preventDefault();
    }
}

/* Add listeners to all radio buttons which update the life display */

exports.addRadioButtonListeners = function () {

    var radioButtons, i;

    radioButtons = document.getElementsByName("sample-rate-radio");

    for (i = 0; i < radioButtons.length; i += 1) {

        radioButtons[i].addEventListener('change', lifeDisplay.updateLifeDisplay);

    }

};

/* Add event listeners to textboxes */

startTimeInput.addEventListener('keypress', checkTimeKeypress);
endTimeInput.addEventListener('keypress', checkTimeKeypress);

sleepDurationInput.addEventListener('change', function () {
    checkInputs(lifeDisplay.updateLifeDisplay);
});

recordingDurationInput.addEventListener('change', function () {
    checkInputs(lifeDisplay.updateLifeDisplay);
});

/* Switch between time zone modes (UTC and local) */

function setTimezoneStatus(local) {

    var timezoneText, timezoneOffset, offsetHours, offsetMins;

    setLocalTime(local);

    timezoneText = "UTC";

    if (isLocalTime()) {

        /* Offset is given as UTC - local time */

        timezoneOffset = calculateTimezoneOffsetHours();

        if (timezoneOffset !== 0) {

            if (timezoneOffset > 0) {
                timezoneText += "+";
            } else {
                timezoneText += "-";
            }

            timezoneOffset = Math.abs(timezoneOffset * 60);
            offsetHours = Math.floor(timezoneOffset / 60);
            offsetMins = timezoneOffset - (offsetHours * 60);

            timezoneText += offsetHours;
            timezoneText += ":";
            timezoneText += offsetMins;

        }

    }

    timezoneLabel.innerText = timezoneText;

    updateUI();

}

exports.setTimezoneStatus = setTimezoneStatus;

function toggleTimezoneStatus() {

    setTimezoneStatus(!isLocalTime());

}

electron.ipcRenderer.on('localTime', toggleTimezoneStatus);

function toggleNightMode() {

    var oldLink, newLink;

    nightMode = !nightMode;

    oldLink = document.getElementById("uiCSS");

    newLink = document.createElement("link");

    newLink.setAttribute("id", "uiCSS");
    newLink.setAttribute("rel", "stylesheet");
    newLink.setAttribute("type", "text/css");

    if (nightMode) {

        newLink.setAttribute("href", "uiNight.css");

    } else {

        newLink.setAttribute("href", "ui.css");

    }

    document.getElementsByTagName("head").item(0).replaceChild(newLink, oldLink);

    updateCanvas();
    drawTimeLabels();

}

electron.ipcRenderer.on('nightmode', toggleNightMode);

function checkUtcToggleability() {

    var timezoneOffset;

    timezoneOffset = calculateTimezoneOffsetMins();

    if (timezoneOffset === 0) {

        applicationMenu.getMenuItemById("localTime").enabled = false;

    }

}

exports.checkUtcToggleability = checkUtcToggleability;

function copyDeviceID() {

    var id = idDisplay.textContent;

    if (id !== "0000000000000000") {

        clipboard.writeText(id);
        idDisplay.style.color = "green";

        setTimeout(function () {
            idDisplay.style.color = "";
        }, 5000);

    }

}

electron.ipcRenderer.on('copyID', copyDeviceID);

idDisplay.addEventListener('click', copyDeviceID);

startTimeInput.focus();