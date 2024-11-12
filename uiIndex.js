/****************************************************************************
 * uiIndex.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global document */

const {ipcRenderer} = require('electron');

const audiomoth = require('audiomoth-hid');
const packetReader = require('./packetReader.js');

const util = require('util');
const electron = require('electron');
const {dialog, Menu, clipboard, BrowserWindow} = require('@electron/remote');

const ui = require('./ui.js');
const schedule = require('./schedule/schedule.js');
const scheduleBar = require('./scheduleBar.js');
const saveLoad = require('./saveLoad.js');
const timeHandler = require('./timeHandler.js');
const lifeDisplay = require('./lifeDisplay.js');

const constants = require('./constants.js');

const uiSchedule = require('./schedule/uiSchedule.js');
const uiSettings = require('./settings/uiSettings.js');
const uiSun = require('./schedule/uiSun.js');

const versionChecker = require('./versionChecker.js');

const THRESHOLD_SCALE_PERCENTAGE = 0;
const THRESHOLD_SCALE_16BIT = 1;
const THRESHOLD_SCALE_DECIBEL = 2;

/* UI components */

const applicationMenu = Menu.getApplicationMenu();

const idDisplay = document.getElementById('id-display');
const idLabel = document.getElementById('id-label');

const firmwareVersionDisplay = document.getElementById('firmware-version-display');
const firmwareVersionLabel = document.getElementById('firmware-version-label');
const firmwareDescriptionDisplay = document.getElementById('firmware-description-display');
const firmwareDescriptionLabel = document.getElementById('firmware-description-label');

const batteryDisplay = document.getElementById('battery-display');
const batteryLabel = document.getElementById('battery-label');

const ledCheckbox = document.getElementById('led-checkbox');
const batteryLevelCheckbox = document.getElementById('battery-level-checkbox');

const firstRecordingDateCheckbox = document.getElementById('first-date-checkbox');

const configureButton = document.getElementById('configure-button');

/* Store version number for packet size checks and description for compatibility check */

let firmwareVersion = '0.0.0';

let firmwareDescription = '-';

/* If the ID of the current device differs from the previous one, then warning messages can be reset */

let previousID = '';

/* Indicate whether the firmware should be updated */

let updateRecommended = false;

/* Whether or not a warning about the version number has been displayed for this device */

let versionWarningShown = false;

/* Whether or not a warning about the firmware has been displayed for this device */

let firmwareWarningShown = false;

/* Whether or not communication with device is currently happening */

let communicating = false;

/* Communication constants */

const MAXIMUM_RETRIES = 10;
const DEFAULT_RETRY_INTERVAL = 100;

/* Used for checking clock speed */

const MAXIMUM_SECONDS_DRIFT_IN_ONE_DAY = 600;

const MINIMUM_ALLOWABLE_AUDIOMOTH_TIME_ERROR = 4;

let displayedClockError = false;

let connectionComputerTime = null;

let connectionAudioMothTime = null;

let sendingConfigurationPacket = false;

/* Utility functions */

async function callWithRetry (funcSync, argument, milliseconds, repeats) {

    let result;

    let attempt = 0;

    while (attempt < repeats) {

        try {

            if (argument) {

                result = await funcSync(argument);

            } else {

                result = await funcSync();

            }

            break;

        } catch (e) {

            const interval = milliseconds / 2 + milliseconds / 2 * Math.random();

            await delay(interval);

            attempt += 1;

        }

    }

    if (result === undefined) throw ('Error: Repeated attempts to access the device failed.');

    if (result === null) throw ('No device detected');

    return result;

}

async function delay (milliseconds) {

    return new Promise(resolve => setTimeout(resolve, milliseconds));

}

/* Promisified versions of AudioMoth-HID calls */

const getFirmwareDescription = util.promisify(audiomoth.getFirmwareDescription);

const getFirmwareVersion = util.promisify(audiomoth.getFirmwareVersion);

const getBatteryState = util.promisify(audiomoth.getBatteryState);

const getID = util.promisify(audiomoth.getID);

const getTime = util.promisify(audiomoth.getTime);

const setPacket = util.promisify(audiomoth.setPacket);

/* Device interaction functions */

async function getAudioMothPacket () {

    try {

        /* Read from AudioMoth */

        const date = await callWithRetry(getTime, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const nowComputerTime = new Date();
        const nowAudioMothTime = date;

        if ((connectionComputerTime === null || connectionAudioMothTime === null) && sendingConfigurationPacket === false) {

            connectionComputerTime = nowComputerTime;
            connectionAudioMothTime = date;

        }

        const id = await callWithRetry(getID, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const description = await callWithRetry(getFirmwareDescription, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const versionArr = await callWithRetry(getFirmwareVersion, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const batteryState = await callWithRetry(getBatteryState, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        /* Compare current date/time object with previous time to make sure clock isn't running too slow/fast */

        if (connectionComputerTime !== null && connectionAudioMothTime !== null && communicating === false && displayedClockError === false) {

            const computerTimeDiff = nowComputerTime - connectionComputerTime;

            const audioMothTimeDiff = nowAudioMothTime - connectionAudioMothTime;

            const maximumAllowableDrift = Math.floor(MAXIMUM_SECONDS_DRIFT_IN_ONE_DAY * computerTimeDiff / constants.MILLISECONDS_IN_SECOND / constants.SECONDS_IN_DAY);

            const measuredAudioMothDrift = Math.round((computerTimeDiff - audioMothTimeDiff) / constants.MILLISECONDS_IN_SECOND);

            if (Math.abs(measuredAudioMothDrift) > MINIMUM_ALLOWABLE_AUDIOMOTH_TIME_ERROR && Math.abs(measuredAudioMothDrift) > maximumAllowableDrift) {

                const direction = measuredAudioMothDrift < 0 ? 'fast' : 'slow';

                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: 'Device clock too ' + direction,
                    message: 'The clock on the connected AudioMoth seems to be running ' + direction + '. Compare the time displayed in the Configuration App to your computer clock to check that your AudioMoth is keeping correct time.'
                });

                displayedClockError = true;

            }

        }

        /* No exceptions have occurred so update display */

        if (id !== previousID) {

            firmwareWarningShown = false;

            versionWarningShown = false;

            previousID = id;

        }

        firmwareVersion = versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2];

        firmwareDescription = description;

        const supported = checkVersionCompatibility();

        if (communicating === false) {

            ui.updateDate(date);

            ui.showTime();

            enableDisplay();

        }

        if (supported === false) configureButton.disabled = true;

        updateIdDisplay(id);

        updateFirmwareDisplay(firmwareVersion, firmwareDescription);

        updateBatteryDisplay(batteryState);

    } catch (e) {

        /* Problem reading from AudioMoth or no AudioMoth */

        disableDisplay();

        displayedClockError = false;

        connectionComputerTime = null;

        connectionAudioMothTime = null;

    }

    /* Schedule the next call */

    const milliseconds = Date.now() % constants.MILLISECONDS_IN_SECOND;

    let delay = constants.MILLISECONDS_IN_SECOND / 2 - milliseconds;

    if (delay < 0) delay += constants.MILLISECONDS_IN_SECOND;

    setTimeout(getAudioMothPacket, delay);

}

function getEquivalentVersion (desc) {

    const foundEquivalence = desc.match(constants.EQUIVALENCE_REGEX)[0];

    const regex1 = /[0-9]+/g;
    const equivalentVersionStrArray = foundEquivalence.match(regex1);
    const equivalentVersionArray = [parseInt(equivalentVersionStrArray[0]), parseInt(equivalentVersionStrArray[1]), parseInt(equivalentVersionStrArray[2])];

    return equivalentVersionArray;

}

/* Check the version and description to see if the firmware is compatible or equivalent to an equivalent version of firmware */

function checkVersionCompatibility () {

    /* This version array may be replaced if the firmware is custom with an equivalent official version */

    let trueVersionArr = firmwareVersion.split('.');

    const classification = constants.getFirmwareClassification(firmwareDescription);

    let versionWarningText, versionWarningTitle;

    switch (classification) {

    case constants.FIRMWARE_OFFICIAL_RELEASE:
    case constants.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE:

        versionWarningTitle = 'Firmware update recommended';
        versionWarningText = 'Update to at least version ' + constants.LATEST_FIRMWARE_VERSION_STRING + ' of AudioMoth-Firmware-Basic firmware to use all the features of this version of the AudioMoth Configuration App.';

        break;

    case constants.FIRMWARE_CUSTOM_EQUIVALENT:

        trueVersionArr = getEquivalentVersion(firmwareDescription);

        versionWarningTitle = 'Unsupported features';
        versionWarningText = 'The firmware installed on your AudioMoth does not allow you to use all the features of this version of the AudioMoth Configuration App.';

        break;

    case constants.FIRMWARE_UNSUPPORTED:

        updateRecommended = false;

        if (firmwareWarningShown === false) {

            firmwareWarningShown = true;

            setTimeout(() => {

                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: 'Unsupported firmware',
                    message: 'The firmware installed on your AudioMoth is not supported by the AudioMoth Configuration App.'
                });

            }, 100);

        }

        return false;

    }

    /* If OFFICIAL_RELEASE, OFFICIAL_RELEASE_CANDIDATE or CUSTOM_EQUIVALENT */

    if (constants.isOlderSemanticVersion(trueVersionArr, constants.LATEST_FIRMWARE_VERSION_MAJOR, constants.LATEST_FIRMWARE_VERSION_MINOR, constants.LATEST_FIRMWARE_VERSION_PATCH)) {

        if (classification === constants.FIRMWARE_OFFICIAL_RELEASE || classification === constants.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE) updateRecommended = true;

        if (versionWarningShown === false) {

            versionWarningShown = true;

            setTimeout(() => {

                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: versionWarningTitle,
                    message: versionWarningText
                });

            }, 100);

        }

    } else {

        updateRecommended = false;

    }

    return true;

}

/* Write bytes into a buffer for transmission */

function writeLittleEndianBytes (buffer, start, byteCount, value) {

    for (let i = 0; i < byteCount; i++) {

        buffer[start + i] = (value >> (i * 8)) & 255;

    }

}

function getTrueFirmwareVersion () {

    let trueFirmwareVersion = firmwareVersion.split('.');

    /* Check for equivalent if using custom firmware */

    const classification = constants.getFirmwareClassification(firmwareDescription);

    if (classification === constants.FIRMWARE_CUSTOM_EQUIVALENT) {

        trueFirmwareVersion = getEquivalentVersion(firmwareDescription);

        console.log('Treating firmware as equivalent version: ' + trueFirmwareVersion[0] + '.' + trueFirmwareVersion[1] + '.' + trueFirmwareVersion[2]);

    }

    /* Use latest version if custom */

    if (classification === constants.FIRMWARE_UNSUPPORTED) {

        trueFirmwareVersion = constants.LATEST_FIRMWARE_VERSION_ARRAY;

        console.log('Unsupported firmware, treating firmware as latest version');

    }

    return trueFirmwareVersion;

}

/* Send configuration packet to AudioMoth */

async function sendAudioMothPacket (packet) {

    const showError = () => {

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'error',
            title: 'Configuration failed',
            message: 'The connected AudioMoth did not respond correctly and the configuration may not have been applied. Please try again.'
        });

        configureButton.classList.remove('grey');

    };

    try {

        const data = await callWithRetry(setPacket, packet, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        /* Check if the firmware version of the device being configured has a known packet length */
        /* If not, the length of the packet sent/received is used */

        let packetLength = Math.min(packet.length, data.length - 1);

        const trueFirmwareVersion = getTrueFirmwareVersion();

        for (let k = 0; k < constants.PACKET_LENGTH_VERSIONS.length; k++) {

            const possibleFirmwareVersion = constants.PACKET_LENGTH_VERSIONS[k].firmwareVersion;

            if (constants.isOlderSemanticVersion(trueFirmwareVersion, possibleFirmwareVersion[0], possibleFirmwareVersion[1], possibleFirmwareVersion[2])) {

                break;

            }

            packetLength = constants.PACKET_LENGTH_VERSIONS[k].packetLength;

        }

        console.log('Using packet length', packetLength);

        /* Verify the packet sent was read correctly by the device by comparing it to the returned packet */

        let matches = true;

        for (let j = 0; j < packetLength; j++) {

            if (packet[j] !== data[j + 1]) {

                console.log('(' + j + ')  ' + packet[j] + ' - ' + data[j + 1]);

                matches = false;

                break;

            }

        }

        if (matches === false) throw ('Packet does not match');

    } catch (e) {

        showError();

    }

}

/**
 * Fit 4 ten bit values into a 5 byte area of a bvffer
 * @param {buffer} buffer Buffer data is to be written to
 * @param {integer} start Where in the buffer to start writing
 * @param {integer} value1 First value
 * @param {integer} value2 Second value
 * @param {integer} value3 Third value
 * @param {integer} value4 Fourth value
 */
function writeFourTenBitValuesAsFiveBytes (buffer, start, value1, value2, value3, value4) {

    buffer[start] = value1 & 0b0011111111;

    buffer[start + 1] = ((value1 & 0b1100000000) >> 8) | ((value2 & 0b0000111111) << 2);

    buffer[start + 2] = ((value2 & 0b1111000000) >> 6) | ((value3 & 0b0000001111) << 4);

    buffer[start + 3] = ((value3 & 0b1111110000) >> 4) | ((value4 & 0b0000000011) << 6);

    buffer[start + 4] = (value4 & 0b1111111100) >> 2;

}

function configureDevice () {

    const USB_LAG = 20;

    const MINIMUM_DELAY = 100;

    console.log('Configuring device');

    const settings = getCurrentConfiguration();

    /* Build configuration packet */

    let index = 0;

    /* Packet length is only increased with updates, so take the size of the latest firmware version packet */

    const maxPacketLength = constants.PACKET_LENGTH_VERSIONS.slice(-1)[0].packetLength;

    const packet = new Uint8Array(maxPacketLength);

    /* Increment to next second transition */

    const sendTime = new Date();

    let delay = constants.MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += constants.MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Make the data packet */

    writeLittleEndianBytes(packet, index, 4, Math.round(sendTime.valueOf() / 1000));
    index += 4;

    packet[index++] = settings.gain;

    /* If equivalent firmware or unsupported firmware is present, use correct firmware version */

    const trueFirmwareVersion = getTrueFirmwareVersion();

    const configurations = (constants.isOlderSemanticVersion(trueFirmwareVersion, 1, 4, 4) && settings.sampleRateIndex < 3) ? constants.OLD_CONFIGURATIONS : constants.CONFIGURATIONS;

    const sampleRateConfiguration = configurations[settings.sampleRateIndex];

    packet[index++] = sampleRateConfiguration.clockDivider;

    packet[index++] = sampleRateConfiguration.acquisitionCycles;

    packet[index++] = sampleRateConfiguration.oversampleRate;

    writeLittleEndianBytes(packet, index, 4, sampleRateConfiguration.sampleRate);
    index += 4;

    packet[index++] = sampleRateConfiguration.sampleRateDivider;

    writeLittleEndianBytes(packet, index, 2, settings.sleepDuration);
    index += 2;

    writeLittleEndianBytes(packet, index, 2, settings.recordDuration);
    index += 2;

    packet[index++] = ledCheckbox.checked ? 1 : 0;

    if (settings.sunScheduleEnabled) {

        let packedValue3 = settings.sunMode & 0b111;
        packedValue3 |= (settings.sunDefinition & 0b11) << 3;

        packet[index++] = packedValue3;

        let latitude = settings.latitude.degrees * 100 + settings.latitude.hundredths;
        latitude *= settings.latitude.positiveDirection ? 1 : -1;

        writeLittleEndianBytes(packet, index, 2, latitude);
        index += 2;

        let longitude = settings.longitude.degrees * 100 + settings.longitude.hundredths;
        longitude *= settings.longitude.positiveDirection ? 1 : -1;

        writeLittleEndianBytes(packet, index, 2, longitude);
        index += 2;

        packet[index++] = settings.sunRounding;

        const sunPeriods = settings.sunPeriods;

        writeFourTenBitValuesAsFiveBytes(packet, index, sunPeriods.sunriseBefore, sunPeriods.sunriseAfter, sunPeriods.sunsetBefore, sunPeriods.sunsetAfter);
        index += 5;

        /* Pad rest of block as normal schedule is 10 bytes longer than sunrise/sunset settings */

        index += 10;

    } else {

        let timePeriods;

        if (constants.isOlderSemanticVersion(trueFirmwareVersion, 1, 9, 0)) {

            /* If AudioMoth is using a firmware version older than 1.9.0, split any periods which wrap around */

            timePeriods = JSON.parse(JSON.stringify(schedule.getTimePeriodsNoWrap()));

        } else {

            timePeriods = JSON.parse(JSON.stringify(schedule.getTimePeriods()));

        }

        timePeriods = timeHandler.sortPeriods(timePeriods);

        packet[index++] = timePeriods.length;

        for (let i = 0; i < timePeriods.length; i++) {

            writeLittleEndianBytes(packet, index, 2, timePeriods[i].startMins);
            index += 2;

            const endMins = timePeriods[i].endMins === 0 ? constants.MINUTES_IN_DAY : timePeriods[i].endMins;
            writeLittleEndianBytes(packet, index, 2, endMins);
            index += 2;

        }

        for (let i = 0; i < (constants.MAX_PERIODS + 1) - timePeriods.length; i++) {

            writeLittleEndianBytes(packet, index, 2, 0);
            index += 2;

            writeLittleEndianBytes(packet, index, 2, 0);
            index += 2;

        }

    }

    const timeZoneOffset = timeHandler.getTimeZoneOffset();

    const offsetHours = timeZoneOffset < 0 ? Math.ceil(timeZoneOffset / constants.MINUTES_IN_HOUR) : Math.floor(timeZoneOffset / constants.MINUTES_IN_HOUR);

    const offsetMins = timeZoneOffset % constants.MINUTES_IN_HOUR;

    packet[index++] = offsetHours;

    /* Low voltage cutoff is always enabled */

    packet[index++] = 1;

    packet[index++] = batteryLevelCheckbox.checked ? 0 : 1;

    /* For non-integer timeZones */

    packet[index++] = offsetMins;

    /* Duty cycle disabled (default value = 0) and filename with device ID */

    /* Duty cycle setting is inverted because setting on device is "duty cycle disabled" but having a negative checkbox would make the UI confusing */

    let packedValue4 = !settings.dutyEnabled ? 1 : 0;

    if (constants.isNewerOrEqualSemanticVersion(trueFirmwareVersion, 1, 11, 0)) {

        packedValue4 |= settings.filenameWithDeviceIDEnabled ? (1 << 1) : 0;

        if (settings.timeSettingFromGPSEnabled) {

            packedValue4 |= settings.acquireGpsFixBeforeAfter === 'individual' ? (1 << 2) : 0;

            packedValue4 |= (settings.gpsFixTime & 0b1111) << 3;

        }

    }

    packet[index++] = packedValue4;

    /* Start/stop dates */

    const firstRecordingDateEnabled = uiSchedule.isFirstRecordingDateEnabled();

    let earliestRecordingTime = 0;

    if (firstRecordingDateEnabled) {

        const dateComponents = ui.extractDateComponents(uiSchedule.getFirstRecordingDate());

        const firstRecordingTimestamp = Date.UTC(dateComponents.year, dateComponents.month - 1, dateComponents.day, 0, 0, 0, 0).valueOf() / 1000;

        const firstRecordingOffsetTimestamp = firstRecordingTimestamp - timeZoneOffset * constants.SECONDS_IN_MINUTE;

        earliestRecordingTime = firstRecordingOffsetTimestamp;

    }

    const lastRecordingDateEnabled = uiSchedule.isLastRecordingDateEnabled();

    let latestRecordingTime = 0;

    if (lastRecordingDateEnabled) {

        const dateComponents = ui.extractDateComponents(uiSchedule.getLastRecordingDate());

        const lastRecordingTimestamp = Date.UTC(dateComponents.year, dateComponents.month - 1, dateComponents.day, 0, 0, 0, 0).valueOf() / 1000;

        const lastRecordingOffsetTimestamp = lastRecordingTimestamp + constants.SECONDS_IN_DAY - timeZoneOffset * constants.SECONDS_IN_MINUTE;

        latestRecordingTime = lastRecordingOffsetTimestamp;

    }

    /* Check ranges of values before sending */

    earliestRecordingTime = Math.min(constants.UINT32_MAX, earliestRecordingTime);
    latestRecordingTime = Math.min(constants.UINT32_MAX, latestRecordingTime);

    writeLittleEndianBytes(packet, index, 4, earliestRecordingTime);
    index += 4;

    writeLittleEndianBytes(packet, index, 4, latestRecordingTime);
    index += 4;

    let lowerFilter, higherFilter;

    /* Filter settings */

    if (settings.passFiltersEnabled && !settings.frequencyTriggerEnabled) {

        switch (settings.filterType) {

        case 'low':
            /* Low-pass */
            lowerFilter = constants.UINT16_MAX;
            higherFilter = settings.higherFilter / 100;
            break;
        case 'band':
            /* Band-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = settings.higherFilter / 100;
            break;
        case 'high':
            /* High-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = constants.UINT16_MAX;
            break;
        case 'none':
            lowerFilter = 0;
            higherFilter = 0;

        }

    } else {

        lowerFilter = 0;
        higherFilter = 0;

    }

    writeLittleEndianBytes(packet, index, 2, lowerFilter);
    index += 2;
    writeLittleEndianBytes(packet, index, 2, higherFilter);
    index += 2;

    /* Amplitude threshold or Goertzel filter frequency can be in this packet index */

    let thresholdUnionValue;

    const amplitudeThresholdScaleIndex = settings.amplitudeThresholdScaleIndex;

    if (settings.amplitudeThresholdingEnabled) {

        let amplitudeThreshold, percentageAmplitudeThreshold;

        /* Amplitude threshold value is based on the value displayed to the user, rather than the raw position on the slider */
        /* E.g. 10% selected, threshold = 10% of the max amplitude */

        switch (amplitudeThresholdScaleIndex) {

        case THRESHOLD_SCALE_16BIT:
            amplitudeThreshold = uiSettings.get16BitAmplitudeThreshold();
            break;

        case THRESHOLD_SCALE_PERCENTAGE:
            percentageAmplitudeThreshold = uiSettings.getPercentageAmplitudeThresholdExponentMantissa();
            amplitudeThreshold = Math.round(32768 * percentageAmplitudeThreshold.mantissa * Math.pow(10, percentageAmplitudeThreshold.exponent) / 100);
            break;

        case THRESHOLD_SCALE_DECIBEL:
            amplitudeThreshold = Math.round(32768 * Math.pow(10, uiSettings.getDecibelAmplitudeThreshold() / 20));
            break;

        }

        thresholdUnionValue = amplitudeThreshold;

    } else if (settings.frequencyTriggerEnabled && constants.isNewerOrEqualSemanticVersion(trueFirmwareVersion, 1, 8, 0)) {

        thresholdUnionValue = settings.frequencyTriggerCentreFrequency / 100;

    } else {

        /* If firmware is older than 1.8.0, then frequency thresholding isn't supported, so just send zero */

        thresholdUnionValue = 0;

    }

    writeLittleEndianBytes(packet, index, 2, thresholdUnionValue);
    index += 2;

    /* Minimum threshold duration, voltage range and whether acoustic configuration is required before deployment */

    let minimumThresholdDuration;
    const minimumThresholdDurations = [0, 1, 2, 5, 10, 15, 30, 60];

    if (settings.amplitudeThresholdingEnabled) {

        minimumThresholdDuration = minimumThresholdDurations[settings.minimumAmplitudeThresholdDuration];

    } else if (settings.frequencyTriggerEnabled && constants.isNewerOrEqualSemanticVersion(trueFirmwareVersion, 1, 8, 0)) {

        minimumThresholdDuration = minimumThresholdDurations[settings.minimumFrequencyTriggerDuration];

    } else {

        minimumThresholdDuration = 0;

    }

    let packedValue0 = settings.requireAcousticConfig ? 1 : 0;
    packedValue0 |= settings.displayVoltageRange ? (1 << 1) : 0;
    packedValue0 |= (minimumThresholdDuration & 0b111111) << 2;

    packet[index++] = packedValue0;

    if (settings.amplitudeThresholdingEnabled) {

        let enableAmplitudeThresholdDecibelScale = 0;
        let enableAmplitudeThresholdPercentageScale = 0;

        switch (amplitudeThresholdScaleIndex) {

        case THRESHOLD_SCALE_16BIT:
            enableAmplitudeThresholdDecibelScale = 1;
            enableAmplitudeThresholdPercentageScale = 1;
            break;

        case THRESHOLD_SCALE_PERCENTAGE:
            enableAmplitudeThresholdDecibelScale = 0;
            enableAmplitudeThresholdPercentageScale = 1;
            break;

        case THRESHOLD_SCALE_DECIBEL:
            enableAmplitudeThresholdDecibelScale = 1;
            enableAmplitudeThresholdPercentageScale = 0;
            break;

        }

        /* Decibel-scale amplitude threshold */

        const amplitudeThresholdDecibels = (amplitudeThresholdScaleIndex === THRESHOLD_SCALE_DECIBEL) ? Math.abs(uiSettings.getDecibelAmplitudeThreshold()) : 0;

        let packedValue1 = enableAmplitudeThresholdDecibelScale & 0b1;
        packedValue1 |= (amplitudeThresholdDecibels & 0b1111111) << 1;

        packet[index++] = packedValue1;

        /* Percentage-scale amplitude threshold */

        let amplitudeThresholdPercentageExponent, amplitudeThresholdPercentageMantissa;

        if (amplitudeThresholdScaleIndex === THRESHOLD_SCALE_PERCENTAGE) {

            const percentageAmplitudeThreshold = uiSettings.getPercentageAmplitudeThresholdExponentMantissa();

            amplitudeThresholdPercentageExponent = percentageAmplitudeThreshold.exponent;
            amplitudeThresholdPercentageMantissa = percentageAmplitudeThreshold.mantissa;

        } else {

            amplitudeThresholdPercentageExponent = 0;
            amplitudeThresholdPercentageMantissa = 0;

        }

        let packedValue2 = enableAmplitudeThresholdPercentageScale & 0b1;
        packedValue2 |= (amplitudeThresholdPercentageMantissa & 0b1111) << 1;
        packedValue2 |= (amplitudeThresholdPercentageExponent & 0b111) << 5;

        packet[index++] = packedValue2;

    } else if (settings.frequencyTriggerEnabled && constants.isNewerOrEqualSemanticVersion(trueFirmwareVersion, 1, 8, 0)) {

        const frequencyTriggerWindowLength = Math.log2(settings.frequencyTriggerWindowLength);
        const frequencyTriggerThreshold = uiSettings.getFrequencyFilterThresholdExponentMantissa();

        let packedValue1 = frequencyTriggerWindowLength & 0b1111;
        packedValue1 |= (frequencyTriggerThreshold.mantissa & 0b1111) << 4;

        packet[index++] = packedValue1;

        const packedValue2 = frequencyTriggerThreshold.exponent & 0b111;

        packet[index++] = packedValue2;

    } else {

        /* If firmware is older than 1.8.0, then frequency thresholding isn't supported, so just send zeroes */

        packet[index++] = 0;
        packet[index++] = 0;

    }

    /* Whether to use NiMH/LiPo voltage range for battery level indication */
    let packedByte3 = settings.energySaverModeEnabled ? 1 : 0;

    /* Whether to turn off the 48Hz DC blocking filter which is on by default */
    packedByte3 |= settings.disable48DCFilter ? (1 << 1) : 0;

    /* Whether to allow the time to be updated via GPS */
    packedByte3 |= settings.timeSettingFromGPSEnabled ? (1 << 2) : 0;

    /* Whether to check the magnetic switch to start a delayed schedule */
    packedByte3 |= settings.magneticSwitchEnabled ? (1 << 3) : 0;

    /* Whether to enable the low gain range */
    packedByte3 |= settings.lowGainRangeEnabled ? (1 << 4) : 0;

    /* Whether to enable the Goertzel frequency filter */
    packedByte3 |= settings.enableFrequencyFilter ? (1 << 5) : 0;

    /* Whether to create a new folder each day to store files */
    packedByte3 |= settings.dailyFolders ? (1 << 6) : 0;

    /* Whether to enable sunrise/sunset scheduling */
    packedByte3 |= settings.sunScheduleEnabled ? (1 << 7) : 0;

    packet[index++] = packedByte3;

    console.log('Packet length: ', index);

    /* Send packet to device */

    console.log('Sending packet:');

    console.log(packet);

    packetReader.read(packet);

    const now = new Date();

    const sendTimeDiff = sendTime.getTime() - now.getTime();

    /* Calculate when to re-enable time display */

    communicating = true;

    ui.disableTimeDisplay();

    sendingConfigurationPacket = true;

    configureButton.disabled = true;

    connectionAudioMothTime = null;

    connectionComputerTime = null;

    displayedClockError = false;

    const updateDelay = sendTimeDiff <= 0 ? constants.MILLISECONDS_IN_SECOND : sendTimeDiff;

    setTimeout(() => {

        communicating = false;

    }, updateDelay);

    /* Either send immediately or wait until the transition */

    if (sendTimeDiff <= 0) {

        console.log('Sending...');

        sendAudioMothPacket(packet);

        sendingConfigurationPacket = false;

    } else {

        console.log('Sending in', sendTimeDiff);

        setTimeout(() => {

            sendAudioMothPacket(packet);

            sendingConfigurationPacket = false;

        }, sendTimeDiff);

    }

}

/* Initialise device information displays */

function initialiseDisplay () {

    ui.showTime();

    idDisplay.textContent = '-';

    batteryDisplay.textContent = '-';

    firmwareVersionDisplay.textContent = '-';

    firmwareDescriptionDisplay.textContent = '-';

}

/* Disable/enable device information display */

function disableDisplay () {

    ui.disableTimeDisplay();

    idLabel.classList.add('grey');
    idDisplay.classList.add('grey');
    firmwareVersionLabel.classList.add('grey');
    firmwareVersionDisplay.classList.add('grey');
    firmwareDescriptionLabel.classList.add('grey');
    firmwareDescriptionDisplay.classList.add('grey');
    batteryLabel.classList.add('grey');
    batteryDisplay.classList.add('grey');

    configureButton.disabled = true;

};

function enableDisplay () {

    idLabel.classList.remove('grey');
    idDisplay.classList.remove('grey');
    firmwareVersionLabel.classList.remove('grey');
    firmwareVersionDisplay.classList.remove('grey');
    firmwareDescriptionLabel.classList.remove('grey');
    firmwareDescriptionDisplay.classList.remove('grey');
    batteryLabel.classList.remove('grey');
    batteryDisplay.classList.remove('grey');

    configureButton.disabled = false;

    ui.enableTimeDisplay();

};

/* Insert retrieved values into device information display */

function updateIdDisplay (deviceId) {

    applicationMenu.getMenuItemById('copyid').enabled = true;

    idDisplay.textContent = deviceId;

};

function updateFirmwareDisplay (version, description) {

    firmwareVersionDisplay.textContent = version;

    if (updateRecommended) {

        firmwareVersionDisplay.textContent += ' (Update recommended)';

    }

    firmwareDescriptionDisplay.textContent = description;

};

function updateBatteryDisplay (battery) {

    batteryDisplay.textContent = battery;

};

function copyDeviceID () {

    const id = idDisplay.textContent;

    clipboard.writeText(id);

    idDisplay.style.color = 'green';

    setTimeout(() => {

        idDisplay.style.color = '';

    }, 2000);

}

electron.ipcRenderer.on('copy-id', copyDeviceID);

function changeTimeZoneStatus (mode) {

    ui.setTimeZoneStatus(mode);

    uiSchedule.updateTimeZoneStatus(mode);

    ui.updateTimeZoneUI();

}

function toggleNightMode () {

    ui.toggleNightMode();

}

function updateLifeDisplayOnChange () {

    let recordingPeriods;

    if (uiSun.usingSunSchedule()) {

        recordingPeriods = uiSun.getRecordingPeriods();

    } else {

        recordingPeriods = JSON.parse(JSON.stringify(schedule.getTimePeriods()));

    }

    recordingPeriods = recordingPeriods.sort((a, b) => {

        return a.startMins - b.startMins;

    });

    const settings = getCurrentConfiguration();

    lifeDisplay.updateLifeDisplay(recordingPeriods, constants.CONFIGURATIONS[settings.sampleRateIndex], settings.recordDuration, settings.sleepDuration, settings.amplitudeThresholdingEnabled, settings.frequencyTriggerEnabled, settings.dutyEnabled, settings.energySaverModeEnabled, settings.timeSettingFromGPSEnabled, settings.acquireGpsFixBeforeAfter, settings.gpsFixTime);

}

lifeDisplay.getPanel().addEventListener('click', () => {

    lifeDisplay.toggleSizeWarning(updateLifeDisplayOnChange);

});

function getCurrentConfiguration () {

    const config = {};

    const settings = uiSettings.getSettings();

    const timePeriods = schedule.getTimePeriodsNoWrap();

    for (let i = 0; i < timePeriods.length; i++) {

        timePeriods[i].startMins = timePeriods[i].startMins === 0 ? 0 : timePeriods[i].startMins;
        timePeriods[i].endMins = timePeriods[i].endMins === 0 ? constants.MINUTES_IN_DAY : timePeriods[i].endMins;

    }

    config.timePeriods = timePeriods;

    config.sunScheduleEnabled = settings.sunScheduleEnabled;

    config.latitude = uiSchedule.getLatitude();
    config.longitude = uiSchedule.getLongitude();

    config.sunMode = uiSchedule.getSunMode();

    config.sunPeriods = uiSchedule.getSunPeriods();

    config.sunRounding = uiSchedule.getSunRounding();

    config.sunDefinition = ipcRenderer.sendSync('request-sun-definition-index');

    config.customTimeZoneOffset = ipcRenderer.sendSync('request-custom-time-zone');

    config.localTime = ui.getTimeZoneMode() === constants.TIME_ZONE_MODE_LOCAL;

    config.ledEnabled = ledCheckbox.checked;
    config.batteryLevelCheckEnabled = batteryLevelCheckbox.checked;

    config.sampleRateIndex = settings.sampleRateIndex;
    config.gain = settings.gain;
    config.recordDuration = settings.recordDuration;
    config.sleepDuration = settings.sleepDuration;
    config.dutyEnabled = settings.dutyEnabled;
    config.filenameWithDeviceIDEnabled = settings.filenameWithDeviceIDEnabled;

    config.passFiltersEnabled = settings.passFiltersEnabled;
    config.filterType = settings.filterType;
    config.lowerFilter = settings.lowerFilter;
    config.higherFilter = settings.higherFilter;

    config.amplitudeThresholdingEnabled = settings.amplitudeThresholdingEnabled;
    config.amplitudeThreshold = settings.amplitudeThreshold;
    config.minimumAmplitudeThresholdDuration = settings.minimumAmplitudeThresholdDuration;

    config.frequencyTriggerEnabled = settings.frequencyTriggerEnabled;
    config.frequencyTriggerWindowLength = settings.frequencyTriggerWindowLength;
    config.frequencyTriggerCentreFrequency = settings.frequencyTriggerCentreFrequency;
    config.minimumFrequencyTriggerDuration = settings.minimumFrequencyTriggerDuration;
    config.frequencyTriggerThreshold = settings.frequencyTriggerThreshold;

    config.firstRecordingDateEnabled = uiSchedule.isFirstRecordingDateEnabled();
    config.lastRecordingDateEnabled = uiSchedule.isLastRecordingDateEnabled();

    config.firstRecordingDate = uiSchedule.getFirstRecordingDate();
    config.lastRecordingDate = uiSchedule.getLastRecordingDate();

    config.requireAcousticConfig = settings.requireAcousticConfig;

    config.dailyFolders = settings.dailyFolders;

    config.displayVoltageRange = settings.displayVoltageRange;

    config.amplitudeThresholdScaleIndex = settings.amplitudeThresholdScaleIndex;

    config.energySaverModeEnabled = settings.energySaverModeEnabled;

    config.disable48DCFilter = settings.disable48DCFilter;

    config.lowGainRangeEnabled = settings.lowGainRangeEnabled;

    config.timeSettingFromGPSEnabled = settings.timeSettingFromGPSEnabled;

    config.acquireGpsFixBeforeAfter = settings.acquireGpsFixBeforeAfter;

    config.gpsFixTime = settings.gpsFixTime;

    config.magneticSwitchEnabled = settings.magneticSwitchEnabled;

    return config;

}

/* Add listeners to save/load menu options */

electron.ipcRenderer.on('save', () => {

    const currentConfig = getCurrentConfiguration();

    saveLoad.saveConfiguration(currentConfig, (err) => {

        if (err) {

            console.error(err);

        } else {

            console.log('Config saved');

        }

    });

});

electron.ipcRenderer.on('load', () => {

    const currentConfig = getCurrentConfiguration();

    saveLoad.loadConfiguration(currentConfig, (timePeriods, ledEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, filenameWithDeviceIDEnabled, recordDuration, sleepDuration, localTime, customTimeZoneOffset, firstRecordingDateEnabled, firstRecordingDate, lastRecordingDateEnabled, lastRecordingDate, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, frequencyTriggerEnabled, frequencyTriggerWindowLength, frequencyTriggerCentreFrequency, minimumFrequencyTriggerDuration, frequencyTriggerThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdScaleIndex, energySaverModeEnabled, disable48DCFilter, lowGainRangeEnabled, timeSettingFromGPSEnabled, acquireGpsFixBeforeAfter, gpsFixTime, magneticSwitchEnabled, dailyFolders, sunScheduleEnabled, latitude, longitude, sunMode, sunPeriods, sunRounding, sunDefinition) => {

        document.activeElement.blur();

        let sortedPeriods = timePeriods;
        sortedPeriods = sortedPeriods.sort(function (a, b) {

            return a.startMins - b.startMins;

        });

        let timeZoneMode;

        if (localTime) {

            timeZoneMode = constants.TIME_ZONE_MODE_LOCAL;

        } else if (customTimeZoneOffset) {

            timeZoneMode = constants.TIME_ZONE_MODE_CUSTOM;

        } else {

            timeZoneMode = constants.TIME_ZONE_MODE_UTC;

        }

        changeTimeZoneStatus(timeZoneMode);

        if (timeZoneMode === constants.TIME_ZONE_MODE_CUSTOM) {

            electron.ipcRenderer.send('set-custom-time-zone', customTimeZoneOffset);

        } else {

            electron.ipcRenderer.send('set-time-zone-menu', timeZoneMode);

        }

        let schedule = [];

        for (let i = 0; i < sortedPeriods.length; i++) {

            schedule = uiSchedule.addTime(sortedPeriods[i].startMins, sortedPeriods[i].endMins, schedule);

        }

        scheduleBar.setSchedule(schedule);

        scheduleBar.updateCanvas();

        uiSchedule.updateTimeList();

        let todayString;

        if (firstRecordingDate === '' || lastRecordingDate === '') {

            let today = new Date();
            const todayTimestamp = today.valueOf();
            const timeZoneOffset = timeHandler.getTimeZoneOffset() * constants.SECONDS_IN_MINUTE * 1000;

            const todayOffsetTimestamp = todayTimestamp + timeZoneOffset;

            today = new Date(todayOffsetTimestamp);

            todayString = ui.formatDateString(today);

        }

        firstRecordingDate = firstRecordingDate === '' ? todayString : firstRecordingDate;
        lastRecordingDate = lastRecordingDate === '' ? todayString : lastRecordingDate;

        uiSchedule.setFirstRecordingDate(firstRecordingDateEnabled, firstRecordingDate);
        uiSchedule.setLastRecordingDate(lastRecordingDateEnabled, lastRecordingDate);

        const settings = {
            sampleRateIndex,
            gain,
            dutyEnabled,
            filenameWithDeviceIDEnabled,
            recordDuration,
            sleepDuration,
            passFiltersEnabled,
            filterType,
            lowerFilter,
            higherFilter,
            amplitudeThresholdingEnabled,
            amplitudeThreshold,
            frequencyTriggerEnabled,
            frequencyTriggerWindowLength,
            frequencyTriggerCentreFrequency,
            minimumFrequencyTriggerDuration,
            frequencyTriggerThreshold,
            requireAcousticConfig,
            dailyFolders,
            displayVoltageRange,
            minimumAmplitudeThresholdDuration,
            amplitudeThresholdScaleIndex,
            energySaverModeEnabled,
            disable48DCFilter,
            lowGainRangeEnabled,
            timeSettingFromGPSEnabled,
            acquireGpsFixBeforeAfter,
            gpsFixTime,
            magneticSwitchEnabled,
            sunRounding,
            sunDefinition
        };

        ledCheckbox.checked = ledEnabled;
        batteryLevelCheckbox.checked = batteryLevelCheckEnabled;

        uiSettings.fillUI(settings);

        electron.ipcRenderer.send('set-sun-definition-index', sunDefinition);

        uiSchedule.updateSunDefinitionUI(sunDefinition);

        uiSchedule.setSunSettings(sunScheduleEnabled, latitude, longitude, sunMode, sunPeriods, sunRounding);

        uiSun.updateMapWindow();

        ui.update();

        updateLifeDisplayOnChange();

    });

});

electron.ipcRenderer.on('update-check', () => {

    versionChecker.checkLatestRelease(function (response) {

        if (response.error) {

            console.error(response.error);

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Failed to check for updates',
                message: response.error
            });

            return;

        }

        if (response.updateNeeded === false) {

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'info',
                buttons: ['OK'],
                title: 'Update not needed',
                message: 'Your app is on the latest version (' + response.latestVersion + ').'
            });

            return;

        }

        const buttonIndex = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Download newer version',
            message: 'A newer version of this app is available (' + response.latestVersion + '), would you like to download it?'
        });

        if (buttonIndex === 0) {

            electron.shell.openExternal('https://www.openacousticdevices.info/applications');

        }

    });

});

/* Prepare UI */

idDisplay.addEventListener('click', copyDeviceID);

disableDisplay();
initialiseDisplay();

getAudioMothPacket();

ui.setTimeZoneStatus(ui.getTimeZoneMode());
ui.updateTimeZoneUI();

electron.ipcRenderer.on('night-mode', toggleNightMode);

electron.ipcRenderer.on('change-time-zone-mode', (e, timeZoneMode) => {

    changeTimeZoneStatus(timeZoneMode);

});

configureButton.addEventListener('click', () => {

    const timePeriods = schedule.getTimePeriods();

    const sunScheduleEnabled = uiSun.usingSunSchedule();

    if (sunScheduleEnabled) {

        const sunRecordingPeriods = uiSun.getRecordingPeriods();
        const sunMode = uiSun.getMode();

        const beforeSunriseMins = uiSun.getBeforeSunriseMins();
        const afterSunriseMins = uiSun.getAfterSunriseMins();
        const beforeSunsetMins = uiSun.getBeforeSunsetMins();
        const afterSunsetMins = uiSun.getAfterSunsetMins();

        const noSunrise = beforeSunriseMins === 0 && afterSunriseMins === 0;
        const noSunset = beforeSunsetMins === 0 && afterSunsetMins === 0;

        const sunDefinitionIndex = ipcRenderer.sendSync('request-sun-definition-index');

        if (constants.isOlderSemanticVersion(firmwareVersion.split('.'), 1, 10, 0)) {

            let message = 'The firmware on the connected AudioMoth does not support ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise/sunset' : 'dawn/dusk';
            message += ' scheduling. Update to at least version 1.10.0 or switch to a fixed schedule to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'Unsupported firmware',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH && noSunrise && noSunset) {

            let message = 'The ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise and sunset' : 'dawn and dusk';
            message += ' recording periods have zero duration. Extend both intervals to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'No recording periods',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunMode === constants.MODE_BEFORE_SUNRISE_AFTER_SUNRISE && noSunrise) {

            let message = 'The ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise' : 'dawn';
            message += ' recording period has zero duration. Extend the ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise' : 'dawn';
            message += ' interval to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'No recording periods',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunMode === constants.MODE_BEFORE_SUNSET_AFTER_SUNSET && noSunset) {

            let message = 'The ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunset' : 'dusk';
            message += ' recording period has zero duration. Extend the ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunset' : 'dusk';
            message += ' interval to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'No recording periods',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH && noSunrise) {

            let message = 'The ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise' : 'dawn';
            message += ' recording period has zero duration. Switch to "';
            switch (sunDefinitionIndex) {

            case constants.SUNRISE_AND_SUNSET:
                message += 'Sunset';
                break;

            case constants.CIVIL_DAWN_AND_DUSK:
                message += 'Civil Dusk';
                break;

            case constants.NAUTICAL_DAWN_AND_DUSK:
                message += 'Nautical Dusk';
                break;

            case constants.ASTRONOMICAL_DAWN_AND_DUSK:
                message += 'Astro Dusk';
                break;

            }

            message += '" recording mode or extend the ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunrise' : 'dawn';
            message += ' interval to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'No recording periods',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunMode === constants.MODE_BEFORE_BOTH_AFTER_BOTH && noSunset) {

            let message = 'The ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunset' : 'dusk';
            message += ' recording period has zero duration. Switch to "';
            switch (sunDefinitionIndex) {

            case constants.SUNRISE_AND_SUNSET:
                message += 'Sunrise';
                break;

            case constants.CIVIL_DAWN_AND_DUSK:
                message += 'Civil Dawn';
                break;

            case constants.NAUTICAL_DAWN_AND_DUSK:
                message += 'Nautical Dawn';
                break;

            case constants.ASTRONOMICAL_DAWN_AND_DUSK:
                message += 'Astro Dawn';
                break;

            }

            message += '" recording mode or extend the ';
            message += sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'sunset' : 'dusk';
            message += ' interval to configure.';

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'No recording periods',
                message
            });

            console.log('Configuration cancelled');

            return;

        }

        if (sunRecordingPeriods.length === 0) {

            let message = sunDefinitionIndex === constants.SUNRISE_AND_SUNSET ? 'Sunrise and sunset' : 'Dawn and dusk';
            message += ' calculation shows no recording periods for the ';
            message += firstRecordingDateCheckbox.checked ? 'selected first recording date' : 'current date';
            message += '. This means the AudioMoth may not record when in CUSTOM mode. Are you sure you wish to apply this configuration?';

            const buttonIndex = dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['Yes', 'No'],
                title: 'No recording periods',
                message
            });

            if (buttonIndex === 1) {

                console.log('Configuration cancelled');

                return;

            }

        }

    } else if (timePeriods.length === 0) {

        const buttonIndex = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'No recording periods',
            message: 'No recording periods have been scheduled. This means the AudioMoth will not record when in CUSTOM mode. Are you sure you wish to apply this configuration?'
        });

        if (buttonIndex === 1) {

            console.log('Configuration cancelled');

            return;

        }

    }

    configureDevice();

});

uiSun.prepareUI(() => {

    updateLifeDisplayOnChange();
    scheduleBar.updateCanvas();

});

uiSchedule.prepareUI(updateLifeDisplayOnChange);
uiSettings.prepareUI(updateLifeDisplayOnChange);
