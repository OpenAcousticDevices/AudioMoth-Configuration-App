
/****************************************************************************
 * uiIndex.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global document */

const audiomoth = require('audiomoth-hid');
const packetReader = require('./packetReader.js');

const electron = require('electron');
const dialog = electron.remote.dialog;
const Menu = electron.remote.Menu;
const clipboard = electron.remote.clipboard;
const BrowserWindow = electron.remote.BrowserWindow;

const ui = require('./ui.js');
const scheduleBar = require('./scheduleBar.js');
const saveLoad = require('./saveLoad.js');
const timeHandler = require('./timeHandler.js');
const lifeDisplay = require('./lifeDisplay.js');

const constants = require('./constants.js');

const uiSchedule = require('./schedule/uiSchedule.js');
const uiSettings = require('./settings/uiSettings.js');

const versionChecker = require('./versionChecker.js');

const UINT32_MAX = 0xFFFFFFFF;
const UINT16_MAX = 0xFFFF;
const SECONDS_IN_DAY = 86400;

const AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE = 0;
const AMPLITUDE_THRESHOLD_SCALE_16BIT = 1;
const AMPLITUDE_THRESHOLD_SCALE_DECIBEL = 2;

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
const lowVoltageCutoffCheckbox = document.getElementById('low-voltage-cutoff-checkbox');
const batteryLevelCheckbox = document.getElementById('battery-level-checkbox');

const configureButton = document.getElementById('configure-button');

/* Store version number for packet size checks and description for compatibility check */

var firmwareVersion = '0.0.0';
var firmwareDescription = '-';

/* Values read from AudioMoth */

var date, id, batteryState;

/* If the ID of the current device differs from the previous one, then warning messages can be reset */

var previousId = '';

/* Whether or not a warning about the version number has been displayed for this device */

var versionWarningShown = false;

/* Whether or not communication with device is currently happening */

var communicating = false;

/* Compare two semantic versions and return true if older */

function isOlderSemanticVersion (aVersion, bVersion) {

    for (let i = 0; i < aVersion.length; i++) {

        const aVersionNum = aVersion[i];
        const bVersionNum = bVersion[i];

        if (aVersionNum > bVersionNum) {

            return false;

        } else if (aVersionNum < bVersionNum) {

            return true;

        }

    }

    return false;

}

/* Request, receive and handle packet containing battery level and complete request chain by using values */

function requestBatteryState () {

    audiomoth.getBatteryState(function (err, battery) {

        if (err) {

            console.error(err);
            disableDisplay();

        } else if (battery === null) {

            disableDisplay();

        } else {

            batteryState = battery;

            usePacketValues();

        }

    });

}

function getEquivalentVersion (desc) {

    const foundEquivalence = desc.match(constants.EQUIVALENCE_REGEX)[0];

    const regex1 = /[0-9]+/g;
    const equivalentVersionStrArray = foundEquivalence.match(regex1);
    const equivalentVersionArray = [parseInt(equivalentVersionStrArray[0]), parseInt(equivalentVersionStrArray[1]), parseInt(equivalentVersionStrArray[2])];

    return equivalentVersionArray;

}

/* Request, receive and handle packet containing the current firmware version and check the version/description to see if a warning message should be shown */

function requestFirmwareVersion () {

    audiomoth.getFirmwareVersion(function (err, versionArr) {

        if (err) {

            console.error(err);
            disableDisplay();

        } else if (versionArr === null) {

            disableDisplay();

        } else {

            firmwareVersion = versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2];

            requestBatteryState();

        }

    });

}

/* Request, receive and handle the packet containing the description of the current firmware */

function requestFirmwareDescription () {

    audiomoth.getFirmwareDescription(function (err, description) {

        if (err || description === null || description === '') {

            if (err) {

                console.error(err);

            }

            disableDisplay();

        } else {

            firmwareDescription = description;

            requestFirmwareVersion();

        }

    });

}

/* Request, receive and handle the packet containing the ID of the current device */

function requestID () {

    audiomoth.getID(function (err, deviceId) {

        if (err || deviceId === null) {

            if (err) {

                console.error(err);

            }

            disableDisplay();

        } else {

            id = deviceId;

            /* If a new device is connected, allow warnings */

            if (id !== previousId) {

                previousId = id;

                versionWarningShown = false;

            }

            requestFirmwareDescription();

        }

    });

}

/* Request, receive and handle AudioMoth information packet */

function getAudioMothPacket () {

    if (communicating) {

        return;

    }

    audiomoth.getTime(function (err, currentDate) {

        if (err || currentDate === null) {

            date = null;

        } else {

            date = currentDate;

        }

        requestID();

        setTimeout(getAudioMothPacket, 200);

    });

}

/* Check the version and description to see if the firmware is compatible or equivalent to an equivalent version of firmware */

function checkVersionCompatibilty () {

    /* This version array may be replaced if the firmware is custom with an equivalent official version */

    let trueVersionArr = firmwareVersion.split('.');

    const classification = constants.getFirmwareClassification(firmwareDescription);

    let versionWarningText, versionWarningTitle;

    switch (classification) {

    case constants.FIRMWARE_OFFICIAL_RELEASE:
    case constants.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE:
        versionWarningTitle = 'Firmware update recommended';
        versionWarningText = 'Update to at least version ' + constants.latestFirmwareVersionString + ' of AudioMoth-Firmware-Basic to use all the features of this version of the AudioMoth Configuration App.';
        break;

    case constants.FIRMWARE_CUSTOM_EQUIVALENT:
        trueVersionArr = getEquivalentVersion(firmwareDescription);

        versionWarningTitle = 'Unsupported features';
        versionWarningText = 'This firmware does not allow you to use all the features of this version of the AudioMoth Configuration App.';
        break;

    case constants.FIRMWARE_UNSUPPORTED:
        if (!versionWarningShown) {

            versionWarningShown = true;

            dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: 'warning',
                title: 'Unsupported firmware',
                message: 'The firmware installed on your AudioMoth may not be supported by this version of the AudioMoth Configuration App.'
            });

        }

        return;

    }

    /* If OFFICIAL_RELEASE, OFFICIAL_RELEASE_CANDIDATE or CUSTOM_EQUIVALENT */

    if (!versionWarningShown) {

        if (isOlderSemanticVersion(trueVersionArr, constants.latestFirmwareVersionArray)) {

            versionWarningShown = true;

            dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: 'warning',
                title: versionWarningTitle,
                message: versionWarningText
            });

        }

    }

}

/* Fill in time/date, ID, battery state, firmware version */

function usePacketValues () {

    if (communicating) {

        return;

    }

    if (date === null) {

        disableDisplay();

    } else {

        ui.updateDate(date);

        ui.showTime();

        enableDisplay();

        updateIdDisplay(id);

        updateFirmwareDisplay(firmwareVersion, firmwareDescription);

        updateBatteryDisplay(batteryState);

        setTimeout(checkVersionCompatibilty, 100);

    }

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

        trueFirmwareVersion = constants.latestFirmwareVersionArray;
        console.log('Unsupported firmware, treating firmware as latest version');

    }

    return trueFirmwareVersion;

}

/* Send configuration packet to AudioMoth */

function sendPacket (packet) {

    audiomoth.setPacket(packet, function (err, data) {

        const showError = () => {

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Configuration failed',
                message: 'The connected AudioMoth did not respond correctly and the configuration may not have been applied. Please try again.'
            });

            configureButton.style.color = '';

        };

        if (err || data === null || data.length === 0) {

            showError();

        } else {

            let matches = true;

            /* Check if the firmware version of the device being configured has a known packet length */
            /* If not, the length of the packet sent/received is used */

            let packetLength = Math.min(packet.length, data.length - 1);

            const trueFirmwareVersion = getTrueFirmwareVersion();

            for (let k = 0; k < constants.packetLengthVersions.length; k++) {

                const possibleFirmwareVersion = constants.packetLengthVersions[k].firmwareVersion;

                if (isOlderSemanticVersion(trueFirmwareVersion, possibleFirmwareVersion.split('.'))) {

                    break;

                }

                packetLength = constants.packetLengthVersions[k].packetLength;

            }

            console.log('Using packet length', packetLength);

            /* Verify the packet sent was read correctly by the device by comparing it to the returned packet */

            for (let j = 0; j < packetLength; j++) {

                if (packet[j] !== data[j + 1]) {

                    console.log('(' + j + ')  ' + packet[j] + ' - ' + data[j + 1]);
                    matches = false;

                    break;

                }

            }

            if (!matches) {

                showError();

            }

        }

    });

}

function configureDevice () {

    communicating = true;

    ui.disableTimeDisplay(false);
    configureButton.disabled = true;

    const USB_LAG = 20;

    const MINIMUM_DELAY = 100;

    const MILLISECONDS_IN_SECOND = 1000;

    setTimeout(function () {

        communicating = false;

        getAudioMothPacket();

    }, 1500);

    console.log('Configuring device');

    const settings = uiSettings.getSettings();

    /* Build configuration packet */

    let index = 0;

    /* Packet length is only increased with updates, so take the size of the latest firmware version packet */

    const maxPacketLength = constants.packetLengthVersions.slice(-1)[0].packetLength;

    const packet = new Uint8Array(maxPacketLength);

    /* Increment to next second transition */

    const sendTime = new Date();

    let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Make the data packet */

    writeLittleEndianBytes(packet, index, 4, Math.round(sendTime.valueOf() / 1000));
    index += 4;

    packet[index++] = settings.gain;

    /* If equivalent firmware or unsupported firmware is present, use correct firmware version */

    const trueFirmwareVersion = getTrueFirmwareVersion();

    const configurations = (isOlderSemanticVersion(trueFirmwareVersion, ['1', '4', '4']) && settings.sampleRateIndex < 3) ? constants.oldConfigurations : constants.configurations;

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

    let timePeriods = JSON.parse(JSON.stringify(scheduleBar.getTimePeriods()));

    timePeriods = timePeriods.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    packet[index++] = timePeriods.length;

    for (let i = 0; i < timePeriods.length; i++) {

        writeLittleEndianBytes(packet, index, 2, timePeriods[i].startMins);
        index += 2;

        writeLittleEndianBytes(packet, index, 2, timePeriods[i].endMins);
        index += 2;

    }

    for (let i = 0; i < (scheduleBar.MAX_PERIODS + 1) - timePeriods.length; i++) {

        writeLittleEndianBytes(packet, index, 2, 0);
        index += 2;

        writeLittleEndianBytes(packet, index, 2, 0);
        index += 2;

    }

    packet[index++] = ui.isLocalTime() ? timeHandler.calculateTimezoneOffsetHours() : 0;

    packet[index++] = lowVoltageCutoffCheckbox.checked ? 1 : 0;

    packet[index++] = batteryLevelCheckbox.checked ? 0 : 1;

    /* For non-integer timezones */

    packet[index++] = ui.isLocalTime() ? (ui.calculateTimezoneOffsetMins() % 60) : 0;

    /* Duty cycle disabled (default value = 0) */

    packet[index++] = settings.dutyEnabled ? 0 : 1;

    /* Start/stop dates */

    const today = new Date();
    const dayDiff = today.getDate() - today.getUTCDate();

    const timezoneOffset = -60 * today.getTimezoneOffset();

    const firstRecordingDateText = uiSchedule.getFirstRecordingDate();
    const firstRecordingDate = new Date(uiSchedule.getFirstRecordingDate());

    let earliestRecordingTime;

    if (firstRecordingDateText === '') {

        earliestRecordingTime = 0;

    } else {

        /* If the timezone difference has caused the day to differ from the day as a UTC time, undo the offset */

        if (ui.isLocalTime()) {

            firstRecordingDate.setDate(firstRecordingDate.getDate() - dayDiff);

            firstRecordingDate.setSeconds(firstRecordingDate.getSeconds() - timezoneOffset);

        }

        earliestRecordingTime = (firstRecordingDate === -1) ? 0 : new Date(firstRecordingDate).valueOf() / 1000;

    }

    const lastRecordingDateText = uiSchedule.getLastRecordingDate();
    const lastRecordingDate = new Date(uiSchedule.getLastRecordingDate());

    let latestRecordingTime;

    if (lastRecordingDateText === '') {

        latestRecordingTime = 0;

    } else {

        if (ui.isLocalTime()) {

            lastRecordingDate.setDate(lastRecordingDate.getDate() - dayDiff);

            lastRecordingDate.setSeconds(lastRecordingDate.getSeconds() - timezoneOffset);

        }

        const lastRecordingDateTimestamp = (lastRecordingDate === -1) ? 0 : new Date(lastRecordingDate).valueOf() / 1000;

        /* Make latestRecordingTime timestamp inclusive by setting it to the end of the chosen day */
        latestRecordingTime = lastRecordingDateTimestamp + SECONDS_IN_DAY;

    }

    /* Check ranges of values before sending */

    earliestRecordingTime = Math.min(UINT32_MAX, earliestRecordingTime);
    latestRecordingTime = Math.min(UINT32_MAX, latestRecordingTime);

    writeLittleEndianBytes(packet, index, 4, earliestRecordingTime);
    index += 4;

    writeLittleEndianBytes(packet, index, 4, latestRecordingTime);
    index += 4;

    let lowerFilter, higherFilter;

    /* Filter settings */

    if (settings.passFiltersEnabled) {

        switch (settings.filterTypeIndex) {

        case 0:
            /* Low-pass */
            lowerFilter = UINT16_MAX;
            higherFilter = settings.higherFilter / 100;
            break;
        case 1:
            /* Band-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = settings.higherFilter / 100;
            break;
        case 2:
            /* High-pass */
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = UINT16_MAX;
            break;

        }

    } else {

        lowerFilter = 0;
        higherFilter = 0;

    }

    writeLittleEndianBytes(packet, index, 2, lowerFilter);
    index += 2;
    writeLittleEndianBytes(packet, index, 2, higherFilter);
    index += 2;

    /* Amplitude threshold */

    let amplitudeThreshold;

    const amplitudeThresholdingScaleIndex = settings.amplitudeThresholdingScaleIndex;

    if (settings.amplitudeThresholdingEnabled) {

        let percentageAmplitudeThreshold;

        /* Amplitude threshold value is based on the value displayed to the user, rather than the raw position on the slider */
        /* E.g. 10% selected, threshold = 10% of the max amplitude */

        switch (amplitudeThresholdingScaleIndex) {

        case AMPLITUDE_THRESHOLD_SCALE_16BIT:
            amplitudeThreshold = uiSettings.get16BitAmplitudeThreshold();
            break;

        case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:
            percentageAmplitudeThreshold = uiSettings.getPercentageAmplitudeThresholdExponentMantissa();
            amplitudeThreshold = Math.round(32768 * percentageAmplitudeThreshold.mantissa * Math.pow(10, percentageAmplitudeThreshold.exponent) / 100);
            break;

        case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:
            amplitudeThreshold = Math.round(32768 * Math.pow(10, uiSettings.getDecibelAmplitudeThreshold() / 20));
            break;

        }

    } else {

        amplitudeThreshold = 0;

    }

    writeLittleEndianBytes(packet, index, 2, amplitudeThreshold);
    index += 2;

    /* Pack values into a single byte */

    /* Whether or not deployment ID is required */
    const requireAcousticConfig = settings.requireAcousticConfig ? 1 : 0;

    /* Whether to use NiMH/LiPo voltage range for battery level indication */
    const displayVoltageRange = settings.displayVoltageRange ? 1 : 0;

    /* Minimum amplitude threshold duration, voltage range and whether acoustic configuration is required before deployment */

    let minimumAmplitudeThresholdDuration;

    if (settings.amplitudeThresholdingEnabled) {

        const minimumAmplitudeThresholdDurations = [0, 1, 2, 5, 10, 15, 30, 60];
        minimumAmplitudeThresholdDuration = minimumAmplitudeThresholdDurations[settings.minimumAmplitudeThresholdDuration];

    } else {

        minimumAmplitudeThresholdDuration = 0;

    }

    let packedValue0 = requireAcousticConfig;
    packedValue0 |= (displayVoltageRange << 1);
    packedValue0 |= (minimumAmplitudeThresholdDuration << 2);

    packet[index++] = packedValue0;

    let enableAmplitudeThresholdDecibelScale, enableAmplitudeThresholdPercentageScale;

    if (settings.amplitudeThresholdingEnabled) {

        switch (amplitudeThresholdingScaleIndex) {

        case AMPLITUDE_THRESHOLD_SCALE_16BIT:
            enableAmplitudeThresholdDecibelScale = 1;
            enableAmplitudeThresholdPercentageScale = 1;
            break;

        case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:
            enableAmplitudeThresholdDecibelScale = 0;
            enableAmplitudeThresholdPercentageScale = 1;
            break;

        case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:
            enableAmplitudeThresholdDecibelScale = 1;
            enableAmplitudeThresholdPercentageScale = 0;
            break;

        }

        /* Decibel-scale amplitude threshold */

        const amplitudeThresholdDecibels = (amplitudeThresholdingScaleIndex === AMPLITUDE_THRESHOLD_SCALE_DECIBEL) ? Math.abs(uiSettings.getDecibelAmplitudeThreshold()) : 0;

        let packedValue1 = enableAmplitudeThresholdDecibelScale & 1;
        packedValue1 |= (amplitudeThresholdDecibels << 1);

        packet[index++] = packedValue1;

        /* Percentage-scale amplitude threshold */

        let amplitudeThresholdPercentageExponent, amplitudeThresholdPercentageMantissa;

        if (amplitudeThresholdingScaleIndex === AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE) {

            const percentageAmplitudeThreshold = uiSettings.getPercentageAmplitudeThresholdExponentMantissa();

            amplitudeThresholdPercentageExponent = percentageAmplitudeThreshold.exponent;
            amplitudeThresholdPercentageMantissa = percentageAmplitudeThreshold.mantissa;

        } else {

            amplitudeThresholdPercentageExponent = 0;
            amplitudeThresholdPercentageMantissa = 0;

        }

        let packedValue2 = enableAmplitudeThresholdPercentageScale & 1;
        packedValue2 |= (amplitudeThresholdPercentageMantissa << 1);
        packedValue2 |= (amplitudeThresholdPercentageExponent << 5);

        packet[index++] = packedValue2;

    } else {

        packet[index++] = 0;
        packet[index++] = 0;

    }

    /* Whether to use NiMH/LiPo voltage range for battery level indication */
    const energySaverModeEnabled = settings.energySaverModeEnabled ? 1 : 0;

    /* Whether to turn off the 48Hz DC blocking filter which is on by default */
    const disable48DCFilter = settings.disable48DCFilter ? 1 : 0;

    let packedByte3 = energySaverModeEnabled & 1;
    packedByte3 |= (disable48DCFilter << 1);

    packet[index++] = packedByte3;

    console.log('Packet length: ', index);

    /* Send packet to device */

    console.log('Sending packet:');
    console.log(packet);

    packetReader.read(packet);

    const now = new Date();
    const sendTimeDiff = sendTime.getTime() - now.getTime();

    if (sendTimeDiff <= 0) {

        console.log('Sending...');
        sendPacket(packet);

    } else {

        console.log('Sending in', sendTimeDiff);

        setTimeout(function () {

            console.log('Sending...');
            sendPacket(packet);

        }, sendTimeDiff);

    }

}

/* Initialise device information displays */

function initialiseDisplay () {

    idDisplay.textContent = '-';

    ui.showTime();

    batteryDisplay.textContent = '-';

    firmwareVersionDisplay.textContent = '-';

    firmwareDescriptionDisplay.textContent = '-';

}

/* Disable/enable device information display */

function disableDisplay () {

    ui.updateDate(date);
    updateIdDisplay(id);
    updateFirmwareDisplay(firmwareVersion, firmwareDescription);
    updateBatteryDisplay(batteryState);

    ui.disableTimeDisplay(false);

    idLabel.style.color = 'lightgrey';
    idDisplay.style.color = 'lightgrey';
    firmwareVersionLabel.style.color = 'lightgrey';
    firmwareVersionDisplay.style.color = 'lightgrey';
    firmwareDescriptionLabel.style.color = 'lightgrey';
    firmwareDescriptionDisplay.style.color = 'lightgrey';
    batteryLabel.style.color = 'lightgrey';
    batteryDisplay.style.color = 'lightgrey';

    configureButton.disabled = true;

    applicationMenu.getMenuItemById('copyid').enabled = false;

};

function enableDisplay () {

    const textColor = ui.isNightMode() ? 'white' : 'black';

    idLabel.style.color = textColor;

    idDisplay.style.color = textColor;

    firmwareVersionLabel.style.color = textColor;

    firmwareVersionDisplay.style.color = textColor;

    firmwareDescriptionLabel.style.color = textColor;

    firmwareDescriptionDisplay.style.color = textColor;

    batteryLabel.style.color = textColor;

    batteryDisplay.style.color = textColor;

    configureButton.disabled = false;

    applicationMenu.getMenuItemById('copyid').enabled = true;

    ui.enableTimeDisplay();

};

/* Insert retrieved values into device information display */

function updateIdDisplay (deviceId) {

    if (deviceId !== idDisplay.textContent) {

        if (deviceId === null) {

            idDisplay.textContent = '-';

        } else {

            idDisplay.textContent = deviceId;

        }

    }

};

function updateFirmwareDisplay (version, description) {

    if (version !== firmwareVersionDisplay.value) {

        if (version === '0.0.0') {

            firmwareVersionDisplay.textContent = '-';

        } else {

            firmwareVersionDisplay.textContent = version;

        }

    }

    if (description !== firmwareDescriptionDisplay.textContent) {

        if (description === '') {

            firmwareDescriptionDisplay.textContent = '-';

        } else {

            firmwareDescriptionDisplay.textContent = description;

        }

    }

};

function updateBatteryDisplay (battery) {

    if (battery === null) {

        batteryDisplay.textContent = '-';

    } else {

        batteryDisplay.textContent = battery;

    }

};

function copyDeviceID () {

    const id = idDisplay.textContent;

    if (id !== '0000000000000000') {

        clipboard.writeText(id);
        idDisplay.style.color = 'green';

        setTimeout(function () {

            idDisplay.style.color = '';

        }, 5000);

    }

}

electron.ipcRenderer.on('copy-id', copyDeviceID);

function toggleTimezoneStatus () {

    ui.toggleTimezoneStatus();

    uiSchedule.updateTimezoneStatus(ui.isLocalTime());

}

function toggleNightMode () {

    ui.toggleNightMode();

}

function updateLifeDisplayOnChange () {

    let sortedPeriods = JSON.parse(JSON.stringify(scheduleBar.getTimePeriods()));
    sortedPeriods = sortedPeriods.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    const settings = uiSettings.getSettings();

    lifeDisplay.updateLifeDisplay(sortedPeriods, constants.configurations[settings.sampleRateIndex], settings.recordDuration, settings.sleepDuration, settings.amplitudeThresholdingEnabled, settings.dutyEnabled, settings.energySaverModeEnabled);

}

lifeDisplay.getPanel().addEventListener('click', function () {

    lifeDisplay.toggleSizeWarning(updateLifeDisplayOnChange);

});

/* Add listeners to save/load menu options */

electron.ipcRenderer.on('save', function () {

    const timePeriods = scheduleBar.getTimePeriods();

    const localTime = ui.isLocalTime();

    const ledEnabled = ledCheckbox.checked;
    const lowVoltageCutoffEnabled = lowVoltageCutoffCheckbox.checked;
    const batteryLevelCheckEnabled = batteryLevelCheckbox.checked;

    const settings = uiSettings.getSettings();

    const sampleRateIndex = settings.sampleRateIndex;
    const gain = settings.gain;
    const recordDuration = settings.recordDuration;
    const sleepDuration = settings.sleepDuration;
    const dutyEnabled = settings.dutyEnabled;

    const passFiltersEnabled = settings.passFiltersEnabled;
    const filterTypeIndex = settings.filterTypeIndex;
    const lowerFilter = settings.lowerFilter;
    const higherFilter = settings.higherFilter;

    const amplitudeThresholdingEnabled = settings.amplitudeThresholdingEnabled;
    const amplitudeThreshold = settings.amplitudeThreshold;

    const firstRecordingDate = uiSchedule.getFirstRecordingDate();
    const lastRecordingDate = uiSchedule.getLastRecordingDate();

    const requireAcousticConfig = settings.requireAcousticConfig;

    const displayVoltageRange = settings.displayVoltageRange;

    const minimumAmplitudeThresholdDuration = settings.minimumAmplitudeThresholdDuration;

    const amplitudeThresholdingScaleIndex = settings.amplitudeThresholdingScaleIndex;

    const energySaverModeEnabled = settings.energySaverModeEnabled;

    const disable48DCFilter = settings.disable48DCFilter;

    saveLoad.saveConfiguration(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, dutyEnabled, passFiltersEnabled, filterTypeIndex, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter, function (err) {

        if (err) {

            console.error(err);

        } else {

            console.log('Config saved');

        }

    });

});

electron.ipcRenderer.on('load', function () {

    saveLoad.loadConfiguration(function (timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, start, end, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter) {

        let sortedPeriods = timePeriods;
        sortedPeriods = sortedPeriods.sort(function (a, b) {

            return a.startMins - b.startMins;

        });

        ui.setTimezoneStatus(localTime);

        scheduleBar.setSchedule(sortedPeriods);
        uiSchedule.updateTimeList();

        uiSchedule.setFirstRecordingDate(start);
        uiSchedule.setLastRecordingDate(end);

        const settings = {
            sampleRateIndex: sampleRateIndex,
            gain: gain,
            dutyEnabled: dutyEnabled,
            recordDuration: recordDuration,
            sleepDuration: sleepDuration,
            passFiltersEnabled: passFiltersEnabled,
            filterType: filterType,
            lowerFilter: lowerFilter,
            higherFilter: higherFilter,
            amplitudeThresholdingEnabled: amplitudeThresholdingEnabled,
            amplitudeThreshold: amplitudeThreshold,
            requireAcousticConfig: requireAcousticConfig,
            displayVoltageRange: displayVoltageRange,
            minimumAmplitudeThresholdDuration: minimumAmplitudeThresholdDuration,
            amplitudeThresholdingScaleIndex: amplitudeThresholdingScaleIndex,
            energySaverModeEnabled: energySaverModeEnabled,
            disable48DCFilter: disable48DCFilter
        };

        uiSettings.fillUI(settings);

        ledCheckbox.checked = ledEnabled;
        lowVoltageCutoffCheckbox.checked = lowVoltageCutoffEnabled;
        batteryLevelCheckbox.checked = batteryLevelCheckEnabled;

        ui.update();

        updateLifeDisplayOnChange();

    });

});

electron.ipcRenderer.on('update-check', function () {

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

ui.setTimezoneStatus(ui.isLocalTime());

electron.ipcRenderer.on('night-mode', toggleNightMode);

electron.ipcRenderer.on('local-time', toggleTimezoneStatus);

configureButton.addEventListener('click', () => {

    const timePeriods = scheduleBar.getTimePeriods();

    if (timePeriods.length === 0) {

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

ui.checkUtcToggleability();

uiSchedule.prepareUI(updateLifeDisplayOnChange);
uiSettings.prepareUI(updateLifeDisplayOnChange);
