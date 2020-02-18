/****************************************************************************
 * lifeDisplay.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/* global document */

var timeHandler = require('./timePeriods.js');
var ui = require('./ui.js');

var configurations;

/* UI components */

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

var lifeDisplayPanel = document.getElementById('life-display-panel');

/* Energy consumed while device is awaiting an active period */

var sleepEnergy = 0.1;

/* Obtain sample rate configuration data */

exports.setConfigurationData = function (configData) {

    configurations = configData;

};

/* Obtain number of recording periods in a day and the total extra time in the form of truncated recording periods */

function getDailyCounts (timePeriods, recSecs, sleepSecs) {

    var i, periodSecs, totalCompleteRecCount, completeRecCount, totalRecLength, timeRemaining, truncatedRecCount, truncatedRecTime;

    /* Total number of recordings of the intended length */
    totalCompleteRecCount = 0;
    /* Total number of recordings which could not be the intended length, so have been truncated */
    truncatedRecCount = 0;
    /* Total length of all truncated files in seconds */
    truncatedRecTime = 0;

    for (i = 0; i < timePeriods.length; i += 1) {

        /* Calculate how many full recording periods fit in the allotted time */

        periodSecs = (timePeriods[i].endMins - timePeriods[i].startMins) * 60;
        completeRecCount = Math.floor(periodSecs / (recSecs + sleepSecs));

        /* Check if a truncated recording will fit in the rest of the period */
        totalRecLength = completeRecCount * (recSecs + sleepSecs);
        timeRemaining = periodSecs - totalRecLength;

        if (timeRemaining > 0) {

            truncatedRecTime += timeRemaining;
            truncatedRecCount += 1;

        }

        totalCompleteRecCount += completeRecCount;

    }

    return {
        completeRecCount: totalCompleteRecCount,
        truncatedRecCount: truncatedRecCount,
        truncatedRecTime: truncatedRecTime
    };

}

/* Add units to file size string */

function formatFileSize (fileSize) {

    fileSize = Math.round(fileSize / 1024);

    if (fileSize < 10000) {

        return fileSize + ' KB';

    }

    fileSize = Math.round(fileSize / 1024);

    if (fileSize < 10000) {

        return fileSize + ' MB';

    }

    fileSize = Math.round(fileSize / 1024);

    return fileSize + ' GB';

}

/* Update storage and energy usage values in life display box */

function updateLifeDisplay () {

    var text, configuration, recLength, sleepLength, countResponse, completeRecCount, totalRecCount, recSize, truncatedRecordingSize, totalSize, energyUsed, totalRecLength, truncatedRecCount, truncatedRecTime;

    /* If no recording periods exist, do not perform energy calculations */

    if (timeHandler.getTimePeriods().length === 0) {

        lifeDisplayPanel.textContent = '';

        return;

    }

    configuration = configurations[parseInt(ui.getSelectedRadioValue('sample-rate-radio'), 10)];

    recLength = parseInt(recordingDurationInput.value, 10);
    sleepLength = parseInt(sleepDurationInput.value, 10);

    /* Calculate the amount of time spent recording each day */

    countResponse = getDailyCounts(timeHandler.getTimePeriods(), recLength, sleepLength);
    completeRecCount = countResponse.completeRecCount;
    truncatedRecCount = countResponse.truncatedRecCount;
    truncatedRecTime = countResponse.truncatedRecTime;

    totalRecCount = completeRecCount + truncatedRecCount;
    totalRecLength = (completeRecCount * recLength) + truncatedRecTime;

    /* Calculate the size of a days worth of recordings */

    recSize = configuration.sampleRate / configuration.sampleRateDivider * 2 * recLength;
    truncatedRecordingSize = (truncatedRecTime * configuration.sampleRate / configuration.sampleRateDivider * 2);

    totalSize = (recSize * completeRecCount) + truncatedRecordingSize;

    /* Generate life display message */

    text = 'Each day this will produce ';

    text += totalRecCount + ' file';

    text += totalRecCount > 1 ? 's ' : ' ';

    if (completeRecCount > 0) {

        text += ' each up to ' + formatFileSize(recSize) + ' ';

    }

    text += 'totalling ' + formatFileSize(totalSize) + '.<br/>';

    /* Calculate amount of energy used both recording a sleeping over the course of a day */

    energyUsed = totalRecLength * configuration.current / 3600;

    energyUsed += (86400 - totalRecLength) * sleepEnergy / 3600;

    text += 'Daily energy consumption will be approximately ' + Math.round(energyUsed) + ' mAh.';

    lifeDisplayPanel.innerHTML = text;

}

exports.updateLifeDisplay = updateLifeDisplay;
