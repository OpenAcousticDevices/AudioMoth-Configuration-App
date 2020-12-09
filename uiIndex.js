
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
const uiFiltering = require('./settings/uiFiltering.js');

const versionChecker = require('./versionChecker.js');

const UINT16_MAX = 0xFFFF;
const UINT32_MAX = 0xFFFFFFFF;
const SECONDS_IN_DAY = 86400;

/* UI components */

var applicationMenu = Menu.getApplicationMenu();

var idDisplay = document.getElementById('id-display');
var idLabel = document.getElementById('id-label');

var firmwareVersionDisplay = document.getElementById('firmware-version-display');
var firmwareVersionLabel = document.getElementById('firmware-version-label');
var firmwareDescriptionDisplay = document.getElementById('firmware-description-display');
var firmwareDescriptionLabel = document.getElementById('firmware-description-label');

var batteryDisplay = document.getElementById('battery-display');
var batteryLabel = document.getElementById('battery-label');

var ledCheckbox = document.getElementById('led-checkbox');
var lowVoltageCutoffCheckbox = document.getElementById('low-voltage-cutoff-checkbox');
var batteryLevelCheckbox = document.getElementById('battery-level-checkbox');

var configureButton = document.getElementById('configure-button');

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

    if (communicating) {

        return;

    }

    audiomoth.getPacket(function (err, packet) {

        if (err || packet === null) {

            date = null;
            id = null;
            batteryState = null;
            firmwareVersion = '0.0.0';
            firmwareDescription = '-';

        } else {

            date = audiomoth.convertFourBytesFromBufferToDate(packet, 1);

            id = audiomoth.convertEightBytesFromBufferToID(packet, 1 + 4);

            /* If a new device is connected, allow warnings */

            if (id !== previousId) {

                previousId = id;

                versionWarningShown = false;

            }

            batteryState = audiomoth.convertOneByteFromBufferToBatteryState(packet, 1 + 4 + 8);

            firmwareVersionArr = audiomoth.convertThreeBytesFromBufferToFirmwareVersion(packet, 1 + 4 + 8 + 1);
            firmwareVersion = firmwareVersionArr[0] + '.' + firmwareVersionArr[1] + '.' + firmwareVersionArr[2];

            firmwareDescription = audiomoth.convertBytesFromBufferToFirmwareDescription(packet, 1 + 4 + 8 + 1 + 3);

            if (!versionWarningShown && !constants.supportedFirmwareDescs.includes(firmwareDescription)) {

                versionWarningShown = true;

                dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                    type: 'warning',
                    title: 'Unsupported firmware',
                    message: 'The firmware installed on your AudioMoth may not be supported by this version of the AudioMoth Configuration App.'
                });

            } else {

                if (!versionWarningShown && isOlderSemanticVersion(firmwareVersionArr, [1, 5, 0])) {

                    versionWarningShown = true;

                    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                        type: 'warning',
                        title: 'Firmware update recommended',
                        message: 'Update to at least version 1.5.0 of AudioMoth-Firmware-Basic to use all the features of this version of the AudioMoth Configuration App.'
                    });

                }

            }

        }

        usePacketValues();

        setTimeout(getAudioMothPacket, 200);

    });

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

    }

}

/* Write bytes into a buffer for transmission */

function writeLittleEndianBytes (buffer, start, byteCount, value) {

    var i;

    for (i = 0; i < byteCount; i++) {

        buffer[start + i] = (value >> (i * 8)) & 255;

    }

}

/* Send configuration packet to AudioMoth */

function sendPacket (packet) {

    audiomoth.setPacket(packet, function (err, data) {

        var k, j, matches, packetLength, showError, possibleFirmwareVersion;

        showError = function () {

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

            matches = true;

            /* Check if the firmware version of the device being configured has a known packet length */
            /* If not, the length of the packet sent/received is used */

            packetLength = Math.min(packet.length, data.length - 1);

            for (k = 0; k < constants.packetLengthVersions.length; k++) {

                possibleFirmwareVersion = constants.packetLengthVersions[k].firmwareVersion;

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

            if (!matches) {

                showError();

            }

        }

    });

}

function configureDevice () {

    var i, index, delay, sendTime, maxPacketLength, packet, configurations, sampleRateConfiguration, timePeriods, firstRecordingDateTimestamp, lastRecordingDateTimestamp, lowerFilter, higherFilter, firstRecordingDate, lastRecordingDate, settings, amplitudeThreshold, today, dayDiff, firstRecordingDateText, lastRecordingDateText, earliestRecordingTime, latestRecordingTime, now, sendTimeDiff, USB_LAG, MINIMUM_DELAY, MILLISECONDS_IN_SECOND;

    communicating = true;

    ui.disableTimeDisplay(false);
    configureButton.disabled = true;

    USB_LAG = 20;

    MINIMUM_DELAY = 100;

    MILLISECONDS_IN_SECOND = 1000;

    setTimeout(function () {

        communicating = false;

        getAudioMothPacket();

        configureButton.disabled = false;

    }, 1500);

    console.log('Configuring device');

    settings = uiSettings.getSettings();

    /* Build configuration packet */

    index = 0;

    /* Packet length is only increased with updates, so take the size of the latest firmware version packet */

    maxPacketLength = constants.packetLengthVersions.slice(-1)[0].packetLength;

    packet = new Uint8Array(maxPacketLength);

    /* Increment to next second transition */

    sendTime = new Date();

    delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Make the data packet */

    writeLittleEndianBytes(packet, index, 4, Math.round(sendTime.valueOf() / 1000));
    index += 4;

    packet[index++] = settings.gain;

    configurations = (isOlderSemanticVersion(firmwareVersion.split('.'), ['1', '4', '4']) && settings.sampleRateIndex < 3) ? constants.oldConfigurations : constants.configurations;

    sampleRateConfiguration = configurations[settings.sampleRateIndex];

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

    /* Pack values into a single byte */

    /* Whether or not deployment ID is required */
    var requireAcousticConfig = settings.requireAcousticConfig ? 1 : 0;

    /* Whether to use NiMH/LiPo voltage range for battery level indication */
    var displayVoltageRange = settings.displayVoltageRange ? 1 : 0;

    var packetValue = (displayVoltageRange << 1) + requireAcousticConfig;

    packet[index++] = packetValue;

    console.log('Packet length: ', index);

    /* Send packet to device */

    console.log('Sending packet:');
    console.log(packet);

    packetReader.read(packet);

    now = new Date();
    sendTimeDiff = sendTime.getTime() - now.getTime();

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

    var textColor;

    if (ui.isNightMode()) {

        textColor = 'white';

    } else {

        textColor = 'black';

    }

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

function updateIdDisplay (id) {

    if (id !== idDisplay.textContent) {

        idDisplay.textContent = id;

    }

};

function updateFirmwareDisplay (version, description) {

    if (version !== firmwareVersionDisplay.value) {

        if (version === '0.0.0' && constants.supportedFirmwareDescs.includes(firmwareDescription)) {

            firmwareVersionDisplay.textContent = '< 1.2.0';

        } else {

            firmwareVersionDisplay.textContent = version;

        }

    }

    if (description !== firmwareDescriptionDisplay.textContent) {

        firmwareDescriptionDisplay.textContent = description;

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

function updateLifeDisplayOnChange () {

    var sortedPeriods, settings;

    sortedPeriods = JSON.parse(JSON.stringify(scheduleBar.getTimePeriods()));
    sortedPeriods = sortedPeriods.sort(function (a, b) {

        return a.startMins - b.startMins;

    });

    settings = uiSettings.getSettings();

    lifeDisplay.updateLifeDisplay(sortedPeriods, constants.configurations[settings.sampleRateIndex], settings.recordDuration, settings.sleepDuration, settings.amplitudeThresholdingEnabled, settings.dutyEnabled);

}

lifeDisplay.getPanel().addEventListener('click', function () {

    lifeDisplay.toggleSizeWarning(updateLifeDisplayOnChange);

});

/* Add listeners to save/load menu options */

electron.ipcRenderer.on('save', function () {

    var timePeriods, localTime, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, dutyEnabled, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, firstRecordingDate, lastRecordingDate, requireAcousticConfig, displayVoltageRange, settings;

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

    requireAcousticConfig = settings.requireAcousticConfig;

    displayVoltageRange = settings.displayVoltageRange;

    saveLoad.saveConfiguration(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, dutyEnabled, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange, function (err) {

        if (err) {

            console.error(err);

        } else {

            console.log('Config saved');

        }

    });

});

electron.ipcRenderer.on('load', function () {

    saveLoad.loadConfiguration(function (timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, start, end, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange) {

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
            amplitudeThreshold: amplitudeThreshold,
            requireAcousticConfig: requireAcousticConfig,
            displayVoltageRange: displayVoltageRange
        };

        uiSettings.fillUI(settings);

        ledCheckbox.checked = ledEnabled;
        lowVoltageCutoffCheckbox.checked = lowVoltageCutoffEnabled;
        batteryLevelCheckbox.checked = batteryLevelCheckEnabled;

        ui.update();

        lifeDisplay.updateLifeDisplay(sortedPeriods, constants.configurations[sampleRateIndex], recordDuration, sleepDuration, amplitudeThresholdingEnabled, dutyEnabled);

    });

});

electron.ipcRenderer.on('update-check', function () {

    versionChecker.checkLatestRelease(function (response) {

        var buttonIndex;

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

        buttonIndex = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Are you sure?',
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

configureButton.addEventListener('click', configureDevice);

ui.checkUtcToggleability();

uiSchedule.prepareUI(updateLifeDisplayOnChange);
uiSettings.prepareUI(updateLifeDisplayOnChange);
