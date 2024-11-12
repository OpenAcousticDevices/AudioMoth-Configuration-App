/****************************************************************************
 * lifeDisplay.js
 * openacousticdevices.info
 * July 2017
 *****************************************************************************/

'use strict';

const constants = require('./constants.js');

/* global document */

const MAX_WAV_SIZE = 4294966806;

/* UI components */

const lifeDisplayPanel = document.getElementById('life-display-panel');

/* Whether or not the life display box should display the warning or original information */

let displaySizeWarning = true;

exports.getPanel = () => {

    return lifeDisplayPanel;

};

/* Obtain number of recording periods in a day and the total extra time in the form of truncated recording periods */

function getDailyCounts (timePeriods, recSecs, sleepSecs) {

    let totalPrepTime = 0;

    const recordingTimes = [];
    const periodRecordingTimes = [];

    let totalSleepTime = 0;

    let containsTruncatedRecording = false;

    for (let i = 0; i < timePeriods.length; i += 1) {

        const currentPeriodRecordingTimes = [];

        const startMins = timePeriods[i].startMins;
        const endMins = timePeriods[i].endMins;

        let periodSecs = 0;

        if (startMins < endMins) {

            periodSecs = endMins - startMins;

        } else if (startMins === endMins) {

            periodSecs = constants.MINUTES_IN_DAY;

        } else if (startMins > endMins) {

            periodSecs = (constants.MINUTES_IN_DAY - startMins) + endMins;

        }

        periodSecs *= constants.SECONDS_IN_MINUTE;

        /* First recording in a period has prep time scheduled for just before period */

        periodSecs += 1;

        while (periodSecs > 1) {

            /* If there's enough time to open a new file and record */

            if (periodSecs >= 1 + recSecs + sleepSecs) {

                totalPrepTime += 1;
                periodSecs -= 1;

                if (sleepSecs === 0) {

                    /* Prep time cuts into recording time */

                    recordingTimes.push(recSecs - 1);
                    currentPeriodRecordingTimes.push(recSecs - 1);
                    periodSecs -= recSecs - 1;

                } else {

                    recordingTimes.push(recSecs);
                    currentPeriodRecordingTimes.push(recSecs);
                    periodSecs -= recSecs;

                    /* Prep time cuts into sleep time */

                    totalSleepTime += sleepSecs - 1;
                    periodSecs -= sleepSecs - 1;

                }

            } else {

                containsTruncatedRecording = true;

                totalPrepTime += 1;
                periodSecs -= 1;

                const truncatedRecordingLength = Math.min(recSecs, periodSecs);
                recordingTimes.push(truncatedRecordingLength);
                currentPeriodRecordingTimes.push(truncatedRecordingLength);
                periodSecs -= truncatedRecordingLength;

                totalSleepTime += Math.min(periodSecs, sleepSecs);
                periodSecs = 0;

            }

        }

        /* If there's an extra second left (not enough time to open a file and record anything), then just sleep */

        if (periodSecs > 0) {

            totalSleepTime += periodSecs;

        }

        /* Record how many recordings occur and in which period */

        periodRecordingTimes.push(currentPeriodRecordingTimes);

    }

    return {
        prepTime: totalPrepTime,
        recordingTimes,
        periodRecordingTimes,
        sleepTime: totalSleepTime,
        containsTruncatedRecording
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

function getFileSize (sampleRate, sampleRateDivider, secs) {

    return sampleRate / sampleRateDivider * 2 * secs;

}

function calculateLengthMins (startMins, endMins) {

    let length;

    if (startMins < endMins) {

        length = endMins - startMins;

    } else if (startMins === endMins) {

        length = constants.MINUTES_IN_DAY;

    } else if (startMins > endMins) {

        length = (constants.MINUTES_IN_DAY - startMins) + endMins;

    }

    return length;

}

function calculateGpsEnergyUsage (schedule, acquireGpsFixBeforeAfter, waitMinsBeforeRecording, dutyEnabled, recSecs, sleepSecs) {

    const waitSecsBeforeRecording = waitMinsBeforeRecording * constants.SECONDS_IN_MINUTE;

    let fixCount = 0;

    for (let i = 0; i < schedule.length; i++) {

        /* Gap between current period and next one */

        let gapLength = 0;

        /* Calculate the gaps between recordings */

        let timeToAddToNextGap = 0;

        if (acquireGpsFixBeforeAfter === 'individual' && dutyEnabled) {

            const periodStart = schedule[i].startMins;
            let periodEnd = schedule[i].endMins;
            periodEnd += periodStart > periodEnd ? constants.MINUTES_IN_DAY : 0;

            const periodLengthSecs = (periodEnd - periodStart) * constants.SECONDS_IN_MINUTE;

            const completeCycleCount = Math.floor(periodLengthSecs / (recSecs + sleepSecs));

            const overflow = periodLengthSecs % (recSecs + sleepSecs);

            let gapCount = 0;

            if (overflow === 0) {

                /* Record + sleep cycles fit into the period */

                gapCount = completeCycleCount > 0 ? completeCycleCount - 1 : 0;

                timeToAddToNextGap = sleepSecs;

            } else if (overflow <= recSecs) {

                /* The end of the period occurs on a record phase */

                gapCount = completeCycleCount;

            } else {

                /* The end of the period occurs on a sleep phase */

                gapCount = completeCycleCount;

                timeToAddToNextGap = overflow - recSecs;

            }

            fixCount += sleepSecs > waitSecsBeforeRecording ? 2 * gapCount : sleepSecs > constants.MINIMUM_GPS_FIX_TIME ? gapCount : 0;

            timeToAddToNextGap /= constants.SECONDS_IN_MINUTE;

        }

        // console.log('\tFixes after adding fixes inside period', fixCount);

        /* Calculate gap between periods */

        const gapStart = schedule[i].endMins;

        /* The next period could be the current period if only 1 exists */

        let gapEnd = schedule[(i + 1) % schedule.length].startMins;
        gapEnd += gapStart > gapEnd ? 1440 : 0;

        gapLength += gapEnd - gapStart;

        gapLength += timeToAddToNextGap;

        // console.log('Time added from inside period:', timeToAddToNextGap);
        // console.log('Gap length:', gapLength);

        if (gapLength > waitMinsBeforeRecording) {

            /* If the gap between periods is longer than waitSecsBeforeRecording, then the period gets 2 GPS fixes */

            fixCount += 2;

        } else if (gapLength >= constants.MINIMUM_GPS_FIX_TIME / constants.SECONDS_IN_MINUTE) {

            /* If the gap is more than MINIMUM_GPS_FIX_TIME and less than waitSecsBeforeRecording, the period gets 1 GPS fix */

            fixCount += 1;

        }

        /* Otherwise, 0 GPS fixes */

        // console.log('\tFixes after adding fixes between period and next one', fixCount);
        // console.log('-');

    }

    // console.log('GPS fix count:', fixCount);
    // console.log('-------');

    return fixCount * constants.GPS_FIX_CONSUMPTION * constants.GPS_FIX_TIME;

}

/* Update storage and energy usage values in life display box */

exports.updateLifeDisplay = (schedule, configuration, recLength, sleepLength, amplitudeThresholdingEnabled, frequencyTriggerEnabled, dutyEnabled, energySaverChecked, gpsEnabled, acquireGpsFixBeforeAfter, timeBeforeRecording) => {

    const thresholdingEnabled = amplitudeThresholdingEnabled || frequencyTriggerEnabled;

    /* If no recording periods exist, do not perform energy calculations */

    if (schedule.length === 0) {

        lifeDisplayPanel.innerHTML = 'Each day this will produce 0 files, totalling 0 MB.<br/>Daily energy consumption will be approximately 0 mAh.';

        return;

    }

    const energySaverEnabled = energySaverChecked && (configuration.trueSampleRate <= 48);

    const fileOpenEnergy = energySaverEnabled ? 35.0 : 40.0;
    const waitTime = 0.25;
    const waitEnergy = energySaverEnabled ? 7.0 : 10.0;

    const sleepCurrent = 0.1;
    const recordingCurrent = energySaverEnabled ? configuration.energySaverRecordCurrent : configuration.recordCurrent;
    const listenCurrent = energySaverEnabled ? configuration.energySaverListenCurrent : configuration.listenCurrent;

    let preparationInstances = 0;

    /* It's possible for file sizes to vary but overall storage consumption be known, so whether or not 'up to' is used in two locations in the information text varies */

    let upToFile = thresholdingEnabled;
    const upToTotal = thresholdingEnabled;

    let totalSleepTime = 0;
    let totalSize = 0;
    let maxLength = 0;

    let recordingTimes = [];

    /* Calculate the amount of time spent recording each day */

    if (dutyEnabled) {

        const countResponse = getDailyCounts(schedule, recLength, sleepLength);

        preparationInstances = countResponse.prepTime;

        recordingTimes = countResponse.recordingTimes;
        totalSleepTime = countResponse.sleepTime;

        /* Calculate the size of a days worth of recordings */

        for (let i = 0; i < recordingTimes.length; i++) {

            totalSize += configuration.sampleRate / configuration.sampleRateDivider * 2 * recordingTimes[i];

        }

        /* If any files are truncated, file size can vary */

        if (countResponse.containsTruncatedRecording) {

            upToFile = true;

        }

    } else {

        maxLength = 0;

        for (let i = 0; i < schedule.length; i++) {

            const startMins = schedule[i].startMins;
            const endMins = schedule[i].endMins;

            const lengthMins = calculateLengthMins(startMins, endMins);

            preparationInstances += 1;

            const recordingLength = (lengthMins * 60) - 1;
            recordingTimes.push(recordingLength);

            /* If the periods differ in size, include 'up to' when describing the file size. If amplitude thresholding is enabled, it already will include this */

            if (i > 0 && !thresholdingEnabled) {

                const prevPeriod = schedule[i - 1];
                const prevLength = prevPeriod.endMins - prevPeriod.startMins;

                if (lengthMins !== prevLength) {

                    upToFile = true;

                }

            }

            totalSize += getFileSize(configuration.sampleRate, configuration.sampleRateDivider, recordingLength);

            maxLength = (recordingLength > maxLength) ? recordingLength : maxLength;

        }

    }

    const longestRecording = Math.max(...recordingTimes);

    let upToSize = getFileSize(configuration.sampleRate, configuration.sampleRateDivider, longestRecording);

    let recordingsWillBeSplit = false;

    const maxWavLength = Math.floor(MAX_WAV_SIZE / (configuration.sampleRate / configuration.sampleRateDivider * 2));

    for (let i = 0; i < recordingTimes.length; i++) {

        const recLength = recordingTimes[i];

        const recSize = getFileSize(configuration.sampleRate, configuration.sampleRateDivider, recLength);

        if (recSize > MAX_WAV_SIZE) {

            upToFile = true;
            upToSize = MAX_WAV_SIZE;

            recordingsWillBeSplit = true;

            /* Cap recording at max length */

            recordingTimes[i] = maxWavLength;

            const timeRemaining = recLength - maxWavLength;

            /* If there's not enough remaining time to open a file and also record, don't bother */

            if (timeRemaining > 1) {

                preparationInstances += 1;

                /* Order doesn't matter for storage/energy consumption, so just append recording period to the end */

                recordingTimes.push(timeRemaining - 1);

            }

        }

    }

    const totalRecCount = recordingTimes.length;

    const totalRecLength = recordingTimes.reduce((a, b) => a + b, 0);

    /* Generate life display message */

    let text = '';

    if (recordingsWillBeSplit && displaySizeWarning) {

        text += '<b>Recordings will exceed the 4.3 GB max size of a WAV file so will be split.</b><br/>';

    } else {

        text += 'Each day this will produce ';

        text += totalRecCount + ' file';

        text += totalRecCount > 1 ? 's, ' : ' ';

        if (totalRecCount > 1) {

            text += 'each ';
            text += upToFile ? 'up to ' : '';
            text += formatFileSize(upToSize) + ', ';

        }

        text += 'totalling ';
        text += upToTotal ? 'up to ' : '';
        text += formatFileSize(totalSize) + '.<br/>';

    }

    /* Use the file count to work out the average file open time if daily folders are enabled */

    const fileOpenTime = 0.5 + 3.5 * (totalRecCount / 10000) / 2;

    /* Add all the time outside the schedule as sleep time */

    totalSleepTime += Math.max(0, 86400 - preparationInstances - totalRecLength - totalSleepTime);

    /* Preparation is split between opening the file and waiting. Each takes half a second */

    const fileOpenEnergyUsage = preparationInstances * fileOpenTime * fileOpenEnergy / 3600;
    const waitEnergyUsage = preparationInstances * waitTime * waitEnergy / 3600;

    const recordingEnergyUsage = totalRecLength * recordingCurrent / 3600;
    const listeningEnergyUsage = totalRecLength * listenCurrent / 3600;

    const sleepEnergyUsage = totalSleepTime * sleepCurrent / 3600;

    let gpsEnergyUsage = 0.0;

    if (gpsEnabled) {

        gpsEnergyUsage = calculateGpsEnergyUsage(schedule, acquireGpsFixBeforeAfter, timeBeforeRecording, dutyEnabled, recLength, sleepLength);

    }

    if (thresholdingEnabled) {

        let minEnergyUsed = 0;

        minEnergyUsed += fileOpenEnergyUsage;
        minEnergyUsed += waitEnergyUsage;

        minEnergyUsed += listeningEnergyUsage;
        minEnergyUsed += sleepEnergyUsage;

        const minEnergyPrecision = minEnergyUsed > 100 ? 10 : minEnergyUsed > 50 ? 5 : minEnergyUsed > 20 ? 2 : 1;

        minEnergyUsed = Math.round(minEnergyUsed / minEnergyPrecision) * minEnergyPrecision;

        // Add GPS energy after rounding so it's clear what the effect of the GPS on energy consumption is

        minEnergyUsed += gpsEnergyUsage;

        minEnergyUsed = Math.round(minEnergyUsed);

        let maxEnergyUsed = 0;

        maxEnergyUsed += fileOpenEnergyUsage;
        maxEnergyUsed += waitEnergyUsage;

        maxEnergyUsed += recordingEnergyUsage;
        maxEnergyUsed += sleepEnergyUsage;

        const maxEnergyPrecision = maxEnergyUsed > 100 ? 10 : maxEnergyUsed > 50 ? 5 : maxEnergyUsed > 20 ? 2 : 1;

        maxEnergyUsed = Math.round(maxEnergyUsed / maxEnergyPrecision) * maxEnergyPrecision;

        // Add GPS energy after rounding so it's clear what the effect of the GPS on energy consumption is

        maxEnergyUsed += gpsEnergyUsage;

        maxEnergyUsed = Math.round(maxEnergyUsed);

        text += 'Daily energy consumption will be between ' + minEnergyUsed + ' and ' + maxEnergyUsed + ' mAh.';

    } else {

        let energyUsed = 0;

        energyUsed += fileOpenEnergyUsage;
        energyUsed += waitEnergyUsage;

        energyUsed += recordingEnergyUsage;
        energyUsed += sleepEnergyUsage;

        const energyPrecision = energyUsed > 100 ? 10 : energyUsed > 50 ? 5 : energyUsed > 20 ? 2 : 1;

        energyUsed = Math.round(energyUsed / energyPrecision) * energyPrecision;

        // Add GPS energy after rounding so it's clear what the effect of the GPS on energy consumption is

        energyUsed += gpsEnergyUsage;

        energyUsed = Math.round(energyUsed);

        text += 'Daily energy consumption will be approximately ' + energyUsed + ' mAh.';

    }

    lifeDisplayPanel.innerHTML = text;

};

exports.toggleSizeWarning = (updateFunction) => {

    displaySizeWarning = !displaySizeWarning;
    updateFunction();

    if (!displaySizeWarning) {

        setTimeout(() => {

            displaySizeWarning = true;
            updateFunction();

        }, 5000);

    }

};
