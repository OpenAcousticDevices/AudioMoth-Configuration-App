/****************************************************************************
 * lifeDisplay.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/*global document*/

var timeHandler = require('./timePeriods.js');
var ui = require('./ui.js');

var configurations;

/* UI components */

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

var lifeDisplayPanel = document.getElementById('life-display-panel');

/* Obtain sample rate configuration data */

exports.setConfigurationData = function (configData) {

    configurations = configData;

};

/* Obtain number of recording periods in a day and the total extra time in the form of truncated recording periods */

function getDailyCounts(timePeriods, recSecs, sleepSecs) {

    var i, periodSecs, totalRecCount, recCount, totalRecLength, timeRemaining, truncatedRecordingTime;

    totalRecCount = 0;
    truncatedRecordingTime = 0;

    for (i = 0; i < timePeriods.length; i += 1) {

        /* Calculate how many full recording periods fit in the allotted time */

        periodSecs = (timePeriods[i].endMins - timePeriods[i].startMins) * 60;
        recCount = Math.floor(periodSecs / (recSecs + sleepSecs));

        /* Check if a truncated recording will fit in the rest of the period */
        totalRecLength = recCount * (recSecs + sleepSecs);
        timeRemaining = periodSecs - totalRecLength;

        if (timeRemaining >= 0) {

            truncatedRecordingTime += timeRemaining;

        }
        totalRecCount += recCount;

    }

    return {
        totalRecCount: totalRecCount,
        truncatedRecordingTime: truncatedRecordingTime
    };

}

var sleepEnergy = 0.1;

/* Add units to file size string */

function formatFileSize(fileSize) {

    fileSize = Math.round(fileSize / 1024);

    if (fileSize < 10000) {

        return fileSize + " KB";

    }

    fileSize = Math.round(fileSize / 1024);

    if (fileSize < 10000) {

        return fileSize + " MB";

    }

    fileSize = Math.round(fileSize / 1024);

    return fileSize + " GB";

}

/* Update storage and energy usage values in life display box */

function updateLifeDisplay() {

    var text, configuration, recLength, sleepLength, countResponse, recCount, recSize, totalSize, energyUsed, totalRecLength, truncatedRecordingTime;

    /* If no recording periods exist, do not perform energy calculations */

    if (timeHandler.getTimePeriods().length === 0) {

        lifeDisplayPanel.textContent = "";

        return;

    }

    configuration = configurations[parseInt(ui.getSelectedRadioValue("sample-rate-radio"), 10)];

    recLength = parseInt(recordingDurationInput.value, 10);
    sleepLength = parseInt(sleepDurationInput.value, 10);

    /* Calculate the amount of time spent recording each day */

    countResponse = getDailyCounts(timeHandler.getTimePeriods(), recLength, sleepLength);
    recCount = countResponse.totalRecCount;
    truncatedRecordingTime = countResponse.truncatedRecordingTime;

    totalRecLength = (recCount * recLength) + truncatedRecordingTime;

    /* Calculate the size of a days worth of recordings */

    recSize = configuration.sampleRate * 2 * recLength;

    totalSize = (recSize * recCount) + (truncatedRecordingTime * configuration.sampleRate * 2);

    text = "Each day this will produce " + recCount + " files, each of size " + formatFileSize(recSize) + ", totalling " + formatFileSize(totalSize) + ".<br/>";

    /* Calculate amount of energy used both recording a sleeping over the course of a day */

    energyUsed = totalRecLength * configuration.current / 3600;

    energyUsed += (86400 - totalRecLength) * sleepEnergy / 3600;

    text += "Daily energy consumption will be approximately " + Math.round(energyUsed) + " mAh.";

    lifeDisplayPanel.innerHTML = text;

}

exports.updateLifeDisplay = updateLifeDisplay;