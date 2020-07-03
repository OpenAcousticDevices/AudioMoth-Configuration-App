/****************************************************************************
 * lifeDisplay.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

/* global document */

const MAX_WAV_LENGTH = 4294966806;

/* UI components */

var lifeDisplayPanel = document.getElementById('life-display-panel');

/* Energy consumed while device is awaiting an active period */

var sleepEnergy = 0.1;

/* Whether or not the life display box should display the warning or original information */

var displaySizeWarning = true;

exports.getPanel = function () {

    return lifeDisplayPanel;

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

    fileSize = Math.round(fileSize / 1000);

    if (fileSize < 10000) {

        return fileSize + ' kB';

    }

    fileSize = Math.round(fileSize / 1000);

    if (fileSize < 10000) {

        return fileSize + ' MB';

    }

    fileSize = Math.round(fileSize / 1000);

    return fileSize + ' GB';

}

/* Update storage and energy usage values in life display box */

exports.updateLifeDisplay = function (schedule, configuration, recLength, sleepLength, amplitudeThresholdingEnabled, dutyEnabled) {

    var text, countResponse, completeRecCount, totalRecCount, recSize, truncatedRecordingSize, totalSize, energyUsed, totalRecLength, truncatedRecCount, truncatedRecTime, upToFile, upToTotal, i, period, maxLength, length, upToSize, maxFileSize, recordingSize, prevPeriod, prevLength;

    upToFile = amplitudeThresholdingEnabled ? 'up to ' : '';
    upToTotal = amplitudeThresholdingEnabled ? 'up to ' : '';

    /* If no recording periods exist, do not perform energy calculations */

    if (schedule.length === 0) {

        lifeDisplayPanel.innerHTML = 'Each day this will produce 0 files, totalling 0 MB.<br/>Daily energy consumption will be approximately 0 mAh.';

        return;

    }

    /* Calculate the amount of time spent recording each day */

    if (dutyEnabled) {

        countResponse = getDailyCounts(schedule, recLength, sleepLength);
        completeRecCount = countResponse.completeRecCount;
        truncatedRecCount = countResponse.truncatedRecCount;
        truncatedRecTime = countResponse.truncatedRecTime;
        totalRecLength = (completeRecCount * recLength) + truncatedRecTime;

        /* Calculate the size of a days worth of recordings */

        recSize = configuration.sampleRate / configuration.sampleRateDivider * 2 * recLength;
        truncatedRecordingSize = (truncatedRecTime * configuration.sampleRate / configuration.sampleRateDivider * 2);

        totalSize = (recSize * completeRecCount) + truncatedRecordingSize;

    } else {

        completeRecCount = schedule.length;
        truncatedRecCount = 0;
        truncatedRecTime = 0;

        totalRecLength = 0;

        maxLength = 0;

        for (i = 0; i < schedule.length; i++) {

            period = schedule[i];
            length = period.endMins - period.startMins;

            /* If the periods differ in size, include 'up to' when describing the file size. If amplitude thresholding is enabled, it already will include this */

            if (i > 0 && !amplitudeThresholdingEnabled) {

                prevPeriod = schedule[i - 1];
                prevLength = prevPeriod.endMins - prevPeriod.startMins;

                if (length !== prevLength) {

                    upToFile = 'up to ';

                }

            }

            totalRecLength += length;

            maxLength = (length > maxLength) ? length : maxLength;

        }

        totalRecLength *= 60;

        totalSize = configuration.sampleRate / configuration.sampleRateDivider * 2 * totalRecLength;

    }

    totalRecCount = completeRecCount + truncatedRecCount;

    if (completeRecCount > 1) {

        if (dutyEnabled) {

            upToSize = recSize;

        } else {

            maxFileSize = configuration.sampleRate / configuration.sampleRateDivider * 2 * maxLength * 60;
            upToSize = maxFileSize;

        }

    }

    recordingSize = (completeRecCount > 1) ? upToSize : totalSize;

    /* Generate life display message */

    text = '';

    if (recordingSize > MAX_WAV_LENGTH && displaySizeWarning) {

        text += '<b>Recordings will exceed the 4.3 GB max size of a WAV file so will be split.</b><br/>';

    } else {

        text += 'Each day this will produce ';

        text += totalRecCount + ' file';

        text += totalRecCount > 1 ? 's, ' : ' ';

        if (completeRecCount > 1) {

            text += 'each ' + upToFile + formatFileSize(upToSize) + ', ';

        }

        text += 'totalling ' + upToTotal + formatFileSize(totalSize) + '.<br/>';

    }

    /* Calculate amount of energy used both recording a sleeping over the course of a day */

    energyUsed = totalRecLength * configuration.current / 3600;

    energyUsed += (86400 - totalRecLength) * sleepEnergy / 3600;

    energyUsed = Math.round(energyUsed / 10) * 10;

    text += 'Daily energy consumption will be approximately ' + energyUsed + ' mAh.';

    lifeDisplayPanel.innerHTML = text;

};

exports.toggleSizeWarning = function (updateFunction) {

    displaySizeWarning = !displaySizeWarning;
    updateFunction();

    if (!displaySizeWarning) {

        setTimeout(function () {

            displaySizeWarning = true;
            updateFunction();

        }, 5000);

    }

};
