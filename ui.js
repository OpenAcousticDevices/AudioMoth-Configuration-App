/****************************************************************************
 * ui.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/*global window, document*/

var timeHandler = require('./timePeriods.js');
var lifeDisplay = require('./lifeDisplay.js');

var strftime = require('strftime').utc();

/* UI components */

var idDisplay = document.getElementById('id-display');
var idLabel = document.getElementById('id-label');

var timeDisplay = document.getElementById('time-display');

var batteryDisplay = document.getElementById('battery-display');
var batteryLabel = document.getElementById('battery-label');

var startTimeInput = document.getElementById('start-time-input');
var endTimeInput = document.getElementById('end-time-input');

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

var sampling240Label = document.getElementById('sampling-240-label');
var sampling320Label = document.getElementById('sampling-320-label');

var sampling240RadioButton = document.getElementById('sample-rate-radio6');
var sampling320RadioButton = document.getElementById('sample-rate-radio7');

var configureButton = document.getElementById('configure-button');

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

/* Update time period canvas */

function updateCanvas(timePeriods) {

    var i, recX, recLen, currentDate, currentMins, currentX;

    timeContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);

    for (i = 0; i < timePeriods.length; i += 1) {

        recX = timePeriods[i].startMins * timeCanvas.width / 1440; // width / 1440 minutes
        recLen = (timePeriods[i].endMins - timePeriods[i].startMins) * timeCanvas.width / 1440;

        timeContext.fillStyle = "#FF0000";
        timeContext.fillRect(recX, 0, recLen, timeCanvas.height);

    }

    // 6am, midday and 6pm markers\

    timeContext.fillStyle = "#000000";
    timeContext.fillRect(0.25 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.5 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);
    timeContext.fillRect(0.75 * timeCanvas.width, 0, 0.002 * timeCanvas.width, timeCanvas.height);

    currentDate = new Date();
    currentMins = (currentDate.getUTCHours() * 60) + currentDate.getUTCMinutes();
    currentX = currentMins * timeCanvas.width / 1440;

    timeContext.fillStyle = "#00AF00";
    timeContext.fillRect((currentX - 1), 0, 0.004 * timeCanvas.width, timeCanvas.height);

}

exports.updateCanvas = updateCanvas;

/* Regularly update time period canvas so green line reflects current time */

function updateCanvasTimer() {

    updateCanvas(timeHandler.getTimePeriods());
    setTimeout(updateCanvasTimer, 60000);

}

exports.updateCanvasTimer = updateCanvasTimer;

/* Draw labels below time period canvas */

exports.drawTimeLabels = function () {

    labelContext.font = Math.floor(0.25 * timeCanvas.height) + "pt Helvetica";

    labelContext.fillText("00:00", 0, 0.3 * timeCanvas.height);
    labelContext.fillText("06:00", 0.225 * timeCanvas.width, 0.3 * timeCanvas.height);
    labelContext.fillText("12:00", 0.475 * timeCanvas.width, 0.3 * timeCanvas.height);
    labelContext.fillText("18:00", 0.725 * timeCanvas.width, 0.3 * timeCanvas.height);
    labelContext.fillText("24:00", 0.945 * timeCanvas.width, 0.3 * timeCanvas.height);

};

/* Retrieve the radio button selected from a group of named buttons */

function getSelectedRadioValue(radioName) {
    return document.querySelector('input[name="' + radioName + '"]:checked').value;
}

exports.getSelectedRadioValue = getSelectedRadioValue;

/* Initialise device information displays */

function initialiseDisplay() {

    idDisplay.value = "0000000000000000";

    timeDisplay.textContent = "00:00:00 01/01/1970";

    batteryDisplay.textContent = "0.0V";

}

exports.initialiseDisplay = initialiseDisplay;

/* Disable/enable device information display */

exports.disableDisplay = function () {

    timeDisplay.style.color = "lightgrey";

    idLabel.style.color = "lightgrey";

    idDisplay.style.color = "lightgrey";

    batteryLabel.style.color = "lightgrey";

    batteryDisplay.style.color = "lightgrey";

    configureButton.disabled = true;

    initialiseDisplay();

};

exports.enableDisplayAndShowTime = function (date) {

    var strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC("%H:%M:%S %d/%m/%Y", date);

    timeDisplay.style.color = "black";

    idLabel.style.color = "black";

    idDisplay.style.color = "black";

    batteryLabel.style.color = "black";

    batteryDisplay.style.color = "black";

    configureButton.disabled = false;

};

/* Enable the high sample rates */

exports.enableHighSamplingRate = function () {

    sampling240Label.style.color = 'black';
    sampling320Label.style.color = 'black';

    sampling240RadioButton.removeAttribute("disabled");
    sampling320RadioButton.removeAttribute("disabled");

};

/* Insert retrieved values into device information display */

exports.updateIdDisplay = function (id) {

    if (id !== idDisplay.value) {

        idDisplay.value = id;

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

/* Apply range checks to sleep and recording duration textboxes */

function checkInputs(callback) {

    var complete = true;

    complete = inputIsCorrect(sleepDurationInput, 0, 43200);
    complete = inputIsCorrect(recordingDurationInput, 1, 43200) && complete;

    if (complete) {
        callback();
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

    var complete, startTimeSplit, endTimeSplit, startTimestamp, endTimestamp;

    complete = timeInputIsCorrect(startTimeInput);
    complete = timeInputIsCorrect(endTimeInput) && complete;

    startTimeSplit = startTimeInput.value.split(":");
    endTimeSplit = endTimeInput.value.split(":");
    startTimestamp = (parseInt(startTimeSplit[0], 10) * 60) + parseInt(startTimeSplit[1], 10);
    endTimestamp = (parseInt(endTimeSplit[0], 10) * 60) + parseInt(endTimeSplit[1], 10);

    if (endTimestamp === startTimestamp) {

        complete = false;
        setTimeInputStyleError();
        setTimeout(setTimeInputStyleDefault, 2500);

    }

    if (complete) {
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