
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

const ui = require('./ui.js');
const scheduleBar = require('./scheduleBar.js');
const saveLoad = require('./saveLoad.js');
const timeHandler = require('./timeHandler.js');
const lifeDisplay = require('./lifeDisplay.js');

const constants = require('./constants.js');

const uiSchedule = require('./schedule/uiSchedule.js');
const uiSettings = require('./settings/uiSettings.js');
const uiFiltering = require('./settings/uiFiltering.js');

const UINT16_MAX = 0xFFFF;
const UINT32_MAX = 0xFFFFFFFF;
const SECONDS_IN_DAY = 86400;

/* UI components */

var applicationMenu = Menu.getApplicationMenu();

var idDisplay = document.getElementById('id-display');
var idLabel = document.getElementById('id-label');

var firmwareDisplay = document.getElementById('firmware-display');
var firmwareLabel = document.getElementById('firmware-label');

var batteryDisplay = document.getElementById('battery-display');
var batteryLabel = document.getElementById('battery-label');

var ledCheckbox = document.getElementById('led-checkbox');
var lowVoltageCutoffCheckbox = document.getElementById('low-voltage-cutoff-checkbox');
var batteryLevelCheckbox = document.getElementById('battery-level-checkbox');

var configureButton = document.getElementById('configure-button');

/* Store version number for packet size checks */

var firmwareVersion = '< 1.2.0';

/* Values read from AudioMoth */

var date, id, batteryState;

/* Whether or not a warning about the version number has been displayed for this device */

var versionWarningShown = false;

function isOlderSemanticVersion (aVersion, bVersion) {

    var aVersionNum, bVersionNum;

    for (let i = 0; i < aVersion.length; i++) {

        aVersionNum = aVersion[i];
        bVersionNum = bVersion[i];

        if (aVersionNum > bVersionNum) {

            return false;

        } else if (aVersionNum < bVersionNum) {

            return true;

        }

    }

    return false;

}

/* Request, receive and handle AudioMoth information packet */

function getAudioMothPacket () {

    var firmwareVersionArr;

    audiomoth.getPacket(function (err, packet) {

        if (err || packet === null) {

            date = null;
            id = null;
            batteryState = null;
            firmwareVersion = '< 1.2.0';

            versionWarningShown = false;

        } else {

            date = audiomoth.convertFourBytesFromBufferToDate(packet, 1);

            id = audiomoth.convertEightBytesFromBufferToID(packet, 1 + 4);

            batteryState = audiomoth.convertOneByteFromBufferToBatteryState(packet, 1 + 4 + 8);

            firmwareVersionArr = audiomoth.convertThreeBytesFromBufferToFirmwareVersion(packet, 1 + 4 + 8 + 1);

            if (firmwareVersionArr[0] === 0) {

                firmwareVersion = '< 1.2.0';

            } else {

                firmwareVersion = firmwareVersionArr[0] + '.' + firmwareVersionArr[1] + '.' + firmwareVersionArr[2];

                if (isOlderSemanticVersion(firmwareVersionArr, [1, 4, 0]) && !versionWarningShown) {

                    versionWarningShown = true;

                    dialog.showMessageBox(electron.remote.getCurrentWindow(), {
                        type: 'warning',
                        title: 'Firmware update recommended',
                        message: 'Please update your AudioMoth firmware to at least version 1.4.0 in order to use all the features of this version of the AudioMoth Configuration App.'
                    });

                }

            }

        }

        setTimeout(getAudioMothPacket, 1000);

    });

}

/* Fill in time/date, ID, battery state, firmware version */

function usePacketValues () {

    if (date === null) {

        disableDisplay();

    } else {

        ui.updateDate(date);

        ui.showTime();

        enableDisplay();

        updateIdDisplay(id);

        updateFirmwareDisplay(firmwareVersion);

        updateBatteryDisplay(batteryState);

    }

    setTimeout(usePacketValues, 1000);

}

/* Write bytes into a buffer for transmission */

function writeLittleEndianBytes (buffer, start, byteCount, value) {

    var i;

    for (i = 0; i < byteCount; i++) {

        buffer[start + i] = (value >> (i * 8)) & 255;

    }

}

function configureDevice () {

    console.log('Configuring device');

    var i, index, packet, sampleRateConfiguration, timePeriods, firstRecordingDateTimestamp, lastRecordingDateTimestamp, lowerFilter, higherFilter, firstRecordingDate, lastRecordingDate, settings, amplitudeThreshold, today, dayDiff, firstRecordingDateText, lastRecordingDateText, earliestRecordingTime, latestRecordingTime;

    settings = uiSettings.getSettings();

    /* Build configuration packet */

    index = 0;

    packet = new Uint8Array(58);

    writeLittleEndianBytes(packet, index, 4, (new Date()).valueOf() / 1000);
    index += 4;

    packet[index++] = settings.gain;

    sampleRateConfiguration = constants.configurations[settings.sampleRateIndex];

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

    timePeriods = JSON.parse(JSON.stringify(scheduleBar.getTimePeriods()));

    timePeriods = timePeriods.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    packet[index++] = timePeriods.length;

    for (i = 0; i < timePeriods.length; i++) {

        writeLittleEndianBytes(packet, index, 2, timePeriods[i].startMins);
        index += 2;

        writeLittleEndianBytes(packet, index, 2, timePeriods[i].endMins);
        index += 2;

    }

    for (i = 0; i < (scheduleBar.MAX_PERIODS + 1) - timePeriods.length; i++) {

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

    today = new Date();
    dayDiff = today.getDate() - today.getUTCDate();

    var timezoneOffset = -60 * today.getTimezoneOffset();

    firstRecordingDateText = uiSchedule.getFirstRecordingDate();
    firstRecordingDate = new Date(uiSchedule.getFirstRecordingDate());

    if (firstRecordingDateText === '') {

        earliestRecordingTime = 0;

    } else {

        /* If the timezone difference has caused the day to differ from the day as a UTC time, undo the offset */

        if (ui.isLocalTime()) {

            firstRecordingDate.setDate(firstRecordingDate.getDate() - dayDiff);

            firstRecordingDate.setSeconds(firstRecordingDate.getSeconds() - timezoneOffset);

        }

        firstRecordingDateTimestamp = (firstRecordingDate === -1) ? 0 : new Date(firstRecordingDate).valueOf() / 1000;

        earliestRecordingTime = firstRecordingDateTimestamp;

    }

    lastRecordingDateText = uiSchedule.getLastRecordingDate();
    lastRecordingDate = new Date(uiSchedule.getLastRecordingDate());

    if (lastRecordingDateText === '') {

        latestRecordingTime = 0;

    } else {

        if (ui.isLocalTime()) {

            lastRecordingDate.setDate(lastRecordingDate.getDate() - dayDiff);

            lastRecordingDate.setSeconds(lastRecordingDate.getSeconds() - timezoneOffset);

        }

        lastRecordingDateTimestamp = (lastRecordingDate === -1) ? 0 : new Date(lastRecordingDate).valueOf() / 1000;

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

    /* Filter settings */

    if (settings.passFiltersEnabled) {

        switch (settings.filterType) {

        case uiFiltering.FILTER_LOW:
            lowerFilter = UINT16_MAX;
            higherFilter = settings.higherFilter / 100;
            break;
        case uiFiltering.FILTER_HIGH:
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = UINT16_MAX;
            break;
        case uiFiltering.FILTER_BAND:
            lowerFilter = settings.lowerFilter / 100;
            higherFilter = settings.higherFilter / 100;
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

    /* CMV settings */

    amplitudeThreshold = settings.amplitudeThreshold;

    writeLittleEndianBytes(packet, index, 2, settings.amplitudeThresholdingEnabled ? amplitudeThreshold : 0);
    index += 2;

    console.log(index);

    /* Send packet to device */

    console.log('Sending packet:');
    console.log(packet);

    packetReader.read(packet);

    audiomoth.setPacket(packet, function (err, data) {

        var k, j, matches, packetLength, showError, possibleFirmwareVersion;

        showError = function () {

            dialog.showErrorBox('Configuration failed.', 'Configuration was not applied to AudioMoth\nPlease reconnect device and try again.');

        };

        if (err || data === null || data.length === 0) {

            showError();

        } else {

            matches = true;

            /* Check if the firmware version of the device being configured has a known packet length */
            /* If not, the length of the packet sent/received is used */

            packetLength = Math.min(packet.length, data.length - 1);

            for (k = 0; k < constants.packetLengthVersions.length; k++) {

                possibleFirmwareVersion = (k === 0) ? '0.0.0' : constants.packetLengthVersions[k].firmwareVersion;

                if (isOlderSemanticVersion(firmwareVersion.split('.'), possibleFirmwareVersion.split('.'))) {

                    console.log('Using packet length', packetLength);
                    break;

                }

                packetLength = constants.packetLengthVersions[k].packetLength;

            }

            /* Verify the packet sent was read correctly by the device by comparing it to the returned packet */

            for (j = 0; j < packetLength; j++) {

                if (packet[j] !== data[j + 1]) {

                    console.log('(' + j + ')  ' + packet[j] + ' - ' + data[j + 1]);
                    matches = false;

                    break;

                }

            }

            if (matches) {

                configureButton.style.color = 'green';

                setTimeout(function () {

                    configureButton.style.color = '';

                }, 1000);

            } else {

                showError();

            }

        }

    });

}

/* Initialise device information displays */

function initialiseDisplay () {

    idDisplay.textContent = '0000000000000000';

    ui.showTime();

    batteryDisplay.textContent = '0.0V';

    firmwareDisplay.textContent = '0.0.0';

}

/* Disable/enable device information display */

function disableDisplay () {

    idLabel.style.color = 'lightgrey';

    idDisplay.style.color = 'lightgrey';

    firmwareLabel.style.color = 'lightgrey';

    firmwareDisplay.style.color = 'lightgrey';

    batteryLabel.style.color = 'lightgrey';

    batteryDisplay.style.color = 'lightgrey';

    configureButton.disabled = true;

    initialiseDisplay();

    applicationMenu.getMenuItemById('copyid').enabled = false;

    ui.disableTimeDisplay();

};

function enableDisplay () {

    var textColor;

    if (ui.isNightMode()) {

        textColor = 'white';

    } else {

        textColor = 'black';

    }

    idLabel.style.color = textColor;

    idDisplay.style.color = textColor;

    firmwareLabel.style.color = textColor;

    firmwareDisplay.style.color = textColor;

    batteryLabel.style.color = textColor;

    batteryDisplay.style.color = textColor;

    configureButton.disabled = false;

    applicationMenu.getMenuItemById('copyid').enabled = true;

    ui.enableTimeDisplay();

};

/* Insert retrieved values into device information display */

function updateIdDisplay (id) {

    if (id !== idDisplay.textContent) {

        idDisplay.textContent = id;

    }

};

function updateFirmwareDisplay (version) {

    if (version !== firmwareDisplay.value) {

        firmwareDisplay.textContent = version;

    }

};

function updateBatteryDisplay (batteryState) {

    batteryDisplay.textContent = batteryState;

};

function copyDeviceID () {

    var id = idDisplay.textContent;

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

/* Prepare UI */

idDisplay.addEventListener('click', copyDeviceID);

disableDisplay();
initialiseDisplay();

getAudioMothPacket();
setTimeout(usePacketValues, 1000);

ui.setTimezoneStatus(ui.isLocalTime());

electron.ipcRenderer.on('night-mode', toggleNightMode);

electron.ipcRenderer.on('local-time', toggleTimezoneStatus);

configureButton.addEventListener('click', configureDevice);

ui.checkUtcToggleability();

function updateLifeDisplayOnChange () {

    var sortedPeriods, settings;

    sortedPeriods = JSON.parse(JSON.stringify(scheduleBar.getTimePeriods()));
    sortedPeriods = sortedPeriods.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    settings = uiSettings.getSettings();

    lifeDisplay.updateLifeDisplay(sortedPeriods, constants.configurations[settings.sampleRateIndex], settings.recordDuration, settings.sleepDuration, settings.amplitudeThresholdingEnabled, settings.dutyEnabled);

}

uiSchedule.prepareUI(updateLifeDisplayOnChange);
uiSettings.prepareUI(updateLifeDisplayOnChange);

/* Add listeners to save/load menu options */

electron.ipcRenderer.on('save', function () {

    var timePeriods, localTime, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, dutyEnabled, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, firstRecordingDate, lastRecordingDate, settings;

    timePeriods = scheduleBar.getTimePeriods();

    localTime = ui.isLocalTime();

    ledEnabled = ledCheckbox.checked;
    lowVoltageCutoffEnabled = lowVoltageCutoffCheckbox.checked;
    batteryLevelCheckEnabled = batteryLevelCheckbox.checked;

    settings = uiSettings.getSettings();

    sampleRateIndex = settings.sampleRateIndex;
    gain = settings.gain;
    recordDuration = settings.recordDuration;
    sleepDuration = settings.sleepDuration;
    dutyEnabled = settings.dutyEnabled;

    passFiltersEnabled = settings.passFiltersEnabled;
    filterType = settings.filterType;
    lowerFilter = settings.lowerFilter;
    higherFilter = settings.higherFilter;
    amplitudeThresholdingEnabled = settings.amplitudeThresholdingEnabled;
    amplitudeThreshold = settings.amplitudeThreshold;

    firstRecordingDate = uiSchedule.getFirstRecordingDate();
    lastRecordingDate = uiSchedule.getLastRecordingDate();

    saveLoad.saveConfiguration(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, dutyEnabled, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, function (err) {

        if (err) {

            console.error(err);

        } else {

            console.log('Config saved');

        }

    });

});

electron.ipcRenderer.on('load', function () {

    saveLoad.loadConfiguration(function (timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, start, end, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold) {

        var sortedPeriods, settings;

        sortedPeriods = timePeriods;
        sortedPeriods = sortedPeriods.sort(function (a, b) {

            return a.startMins - b.startMins;

        });

        ui.setTimezoneStatus(localTime);

        scheduleBar.setSchedule(sortedPeriods);
        uiSchedule.updateTimeList();

        uiSchedule.setFirstRecordingDate(start);
        uiSchedule.setLastRecordingDate(end);

        settings = {
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
            amplitudeThreshold: amplitudeThreshold
        };

        uiSettings.fillUI(settings);

        ledCheckbox.checked = ledEnabled;
        lowVoltageCutoffCheckbox.checked = lowVoltageCutoffEnabled;
        batteryLevelCheckbox.checked = batteryLevelCheckEnabled;

        ui.update();

        lifeDisplay.updateLifeDisplay(sortedPeriods, constants.configurations[sampleRateIndex], recordDuration, sleepDuration, amplitudeThresholdingEnabled, dutyEnabled);

    });

});
