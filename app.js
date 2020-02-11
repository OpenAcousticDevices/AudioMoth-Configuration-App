/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*global document, Uint8Array*/
/*jslint bitwise: true*/
/*jslint plusplus: true*/

var audiomoth = require('audiomoth-hid');

var ui = require('./ui.js');
var timeHandler = require('./timePeriods.js');
var lifeDisplay = require('./lifeDisplay.js');

var electron = require('electron');
var dialog = electron.remote.dialog;

/* UI components */

var ledCheckbox = document.getElementById('led-checkbox');
var batteryCheckbox = document.getElementById('battery-checkbox');
var batteryLevelCheckbox = document.getElementById('battery-level-checkbox');

var sleepDurationInput = document.getElementById('sleep-duration-input');
var recordingDurationInput = document.getElementById('recording-duration-input');

var configureButton = document.getElementById('configure-button');

/* Setting parameters */

var configurations = [{
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 32,
    current: 10.5
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 16,
    current: 12.0
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 8,
    current: 12.5
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8,
    current: 13.5
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4,
    current: 17.5
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2,
    current: 24.5
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 1,
    current: 30.0
}, {
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1,
    current: 39.0
}];

/* Packet lengths for each version */

var packetLengthVersions = [{
    firmwareVersion: "< 1.2.0",
    packetLength: 39
}, {
    firmwareVersion: "1.2.0",
    packetLength: 40
}, {
    firmwareVersion: "1.2.1",
    packetLength: 42
}, {
    firmwareVersion: "1.2.2",
    packetLength: 43
}];

function errorOccurred(err) {

    console.error(err);

    ui.disableDisplay();

}

/* Store version number for packet size checks */

var firmwareVersion = "< 1.2.0";

/* Request, receive and handle AudioMoth information packet */

function getAudioMothPacket() {

    var id, date, batteryState, firmwareVersionArr;

    audiomoth.getPacket(function (err, packet) {

        if (err) {

            errorOccurred(err);

        } else if (packet === null) {

            ui.disableDisplay();

        } else {

            date = audiomoth.convertFourBytesFromBufferToDate(packet, 1);

            id = audiomoth.convertEightBytesFromBufferToID(packet, 1 + 4);

            batteryState = audiomoth.convertOneByteFromBufferToBatteryState(packet, 1 + 4 + 8);

            firmwareVersionArr = audiomoth.convertThreeBytesFromBufferToFirmwareVersion(packet, 1 + 4 + 8 + 1);

            if (firmwareVersionArr[0] === 0) {

                firmwareVersion = "< 1.2.0";

            } else {

                firmwareVersion = firmwareVersionArr[0] + "." + firmwareVersionArr[1] + "." + firmwareVersionArr[2];

            }

            ui.updateDate(date);

            ui.showTime();

            ui.enableDisplay();

            ui.updateIdDisplay(id);

            ui.updateFirmwareDisplay(firmwareVersion);

            ui.updateBatteryDisplay(batteryState);

        }

        setTimeout(getAudioMothPacket, 1000);

    });

}

/* Write bytes into a buffer for transmission */

function writeLittleEndianBytes(buffer, start, byteCount, value) {

    var i;

    for (i = 0; i < byteCount; i += 1) {

        buffer[start + i] = (value >> (i * 8)) & 255;

    }

}

/* Submit configuration packet and configure device */

function configureDevice() {

    var i, index, packet, configuration, timePeriods, timezoneTimePeriods;

    /* Build configuration packet */

    index = 0;

    packet = new Uint8Array(62);

    writeLittleEndianBytes(packet, index, 4, (new Date()).valueOf() / 1000);
    index += 4;

    packet[index++] = parseInt(ui.getSelectedRadioValue("gain-radio"), 10);

    configuration = configurations[parseInt(ui.getSelectedRadioValue("sample-rate-radio"), 10)];

    packet[index++] = configuration.clockDivider;

    packet[index++] = configuration.acquisitionCycles;

    packet[index++] = configuration.oversampleRate;

    writeLittleEndianBytes(packet, index, 4, configuration.sampleRate);
    index += 4;

    packet[index++] = configuration.sampleRateDivider;

    writeLittleEndianBytes(packet, index, 2, sleepDurationInput.value);
    index += 2;

    writeLittleEndianBytes(packet, index, 2, recordingDurationInput.value);
    index += 2;

    packet[index++] = ledCheckbox.checked ? 1 : 0;

    timePeriods = timeHandler.getTimePeriods();

    timezoneTimePeriods = timePeriods;

    timezoneTimePeriods = timezoneTimePeriods.sort(function (a, b) {
        return a.startMins - b.startMins;
    });

    /* Apply timezone changes to time period list */

    packet[index++] = timezoneTimePeriods.length;

    for (i = 0; i < timezoneTimePeriods.length; i += 1) {

        writeLittleEndianBytes(packet, index, 2, timezoneTimePeriods[i].startMins);
        index += 2;

        writeLittleEndianBytes(packet, index, 2, timezoneTimePeriods[i].endMins);
        index += 2;

    }

    for (i = 0; i < (timeHandler.MAX_PERIODS + 1) - timezoneTimePeriods.length; i += 1) {

        writeLittleEndianBytes(packet, index, 2, 0);
        index += 2;

        writeLittleEndianBytes(packet, index, 2, 0);
        index += 2;

    }

    packet[index++] = ui.isLocalTime() ? ui.calculateTimezoneOffsetHours() : 0;

    packet[index++] = batteryCheckbox.checked ? 1 : 0;

    packet[index++] = batteryLevelCheckbox.checked ? 0 : 1;

    packet[index++] = ui.isLocalTime() ? ui.calculateTimezoneOffsetMins() % 60 : 0;

    /* Send packet to device */

    console.log("Sent: " + packet);

    audiomoth.setPacket(packet, function (err, data) {

        var k, j, matches, packetLength, showError;

        showError = function () {
            dialog.showErrorBox("Configuration failed.", "Configuration was not applied to AudioMoth\nPlease reconnect device and try again.");
        };

        if (err || data === null || data.length === 0) {

            showError();

        } else {

            matches = true;

            /* Check if the firmware version of the device being configured has a known packet length */
            /* If not, the length of the packet sent/received is used */

            packetLength = Math.min(packet.length, data.length - 1);

            for (k = 0; k < packetLengthVersions.length; k += 1) {

                if (packetLengthVersions[k].firmwareVersion === firmwareVersion) {

                    packetLength = packetLengthVersions[k].packetLength;

                }

            }

            /* Verify the packet sent was read correctly by the device by comparing it to the returned packet */

            for (j = 0; j < packetLength; j += 1) {

                if (packet[j] !== data[j + 1]) {

                    console.log("(" + j + ")  Expected: " + packet[j] + ' Received: ' + data[j + 1]);

                    matches = false;

                    break;

                }

            }

            if (matches) {

                configureButton.style.color = "green";

                setTimeout(function () {
                    configureButton.style.color = "";
                }, 1000);

            } else {

                console.log("Received: " + data);

                showError();

            }

        }

    });

}

/* Initialise lifeDisplay configuration data */

lifeDisplay.setConfigurationData(configurations);

/* Initialise UI elements */

ui.drawTimeLabels();

timeHandler.updateTimeList();

ui.updateCanvasTimer();

ui.disableDisplay();

ui.initialiseDisplay();

ui.addRadioButtonListeners();

ui.checkUtcToggleability();

setTimeout(getAudioMothPacket, 1000);

configureButton.addEventListener('click', function () {
    ui.checkInputs(configureDevice);
});