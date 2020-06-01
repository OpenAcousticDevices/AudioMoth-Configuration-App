/****************************************************************************
 * packetReader.js
 * openacousticdevices.info
 * April 2020
 *****************************************************************************/

'use strict';

const audiomoth = require('audiomoth-hid');

function fourBytesToNumber (buffer, offset) {

    return (buffer[offset] & 0xFF) + ((buffer[offset + 1] & 0xFF) << 8) + ((buffer[offset + 2] & 0xFF) << 16) + ((buffer[offset + 3] & 0xFF) << 24);

}

function twoBytesToNumber (buffer, offset) {

    return (buffer[offset] & 0xFF) + ((buffer[offset + 1] & 0xFF) << 8);

}

function digitWithLeadingZero (value) {

    var formattedString = '0' + value;

    return formattedString.substring(formattedString.length - 2);

}

function formatTime (minutes) {

    return digitWithLeadingZero(Math.floor(minutes / 60)) + ':' + digitWithLeadingZero(minutes % 60);

}

function formatDate (date) {

    return (date.valueOf() / 1000) + ' - ' + date.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' (UTC)';

}

/*

#define MAX_START_STOP_PERIODS              5

typedef struct {
    uint16_t startMinutes;
    uint16_t stopMinutes;
} startStopPeriod_t;

typedef struct {
    uint32_t time;
    uint8_t gain;
    uint8_t clockDivider;
    uint8_t acquisitionCycles;
    uint8_t oversampleRate;
    uint32_t sampleRate;
    uint8_t sampleRateDivider;
    uint16_t sleepDuration;
    uint16_t recordDuration;
    uint8_t enableLED;
    uint8_t activeStartStopPeriods;
    startStopPeriod_t startStopPeriods[MAX_START_STOP_PERIODS];
    int8_t timezoneHours;
    uint8_t enableLowVoltageCutoff;
    uint8_t disableBatteryLevelDisplay;
    int8_t timezoneMinutes;
    uint8_t disableSleepRecordCycle;
    uint32_t earliestRecordingTime;
    uint32_t latestRecordingTime;
    uint16_t lowerFilterFreq;
    uint16_t higherFilterFreq;
    uint16_t amplitudeThreshold;
} configSettings_t;

*/

exports.read = function (packet) {

    var i, j, time, gain, clockDivider, acquisitionCycles, oversampleRate, sampleRate, sampleRateDivider, sleepDuration, recordDuration, enableLED, activeStartStopPeriods, startStopPeriods, timezoneHours, enableLowVoltageCutoff, disableBatteryLevelDisplay, timezoneMinutes, disableSleepRecordCycle, earliestRecordingTime, latestRecordingTime, lowerFilterFreq, higherFilterFreq, amplitudeThreshold, startMinutes, stopMinutes;

    /* Read and decode configuration packet */

    time = audiomoth.convertFourBytesFromBufferToDate(packet, 0);

    gain = packet[4];
    clockDivider = packet[5];
    acquisitionCycles = packet[6];
    oversampleRate = packet[7];

    sampleRate = fourBytesToNumber(packet, 8);
    sampleRateDivider = packet[12];

    sleepDuration = twoBytesToNumber(packet, 13);
    recordDuration = twoBytesToNumber(packet, 15);

    enableLED = packet[17];

    activeStartStopPeriods = packet[18];
    startStopPeriods = [];

    for (i = 0; i < activeStartStopPeriods; i += 1) {

        startMinutes = twoBytesToNumber(packet, 19 + 4 * i);
        stopMinutes = twoBytesToNumber(packet, 21 + 4 * i);

        startStopPeriods.push({startMinutes: startMinutes, stopMinutes: stopMinutes});

    }

    timezoneHours = packet[39];

    enableLowVoltageCutoff = packet[40];
    disableBatteryLevelDisplay = packet[41];

    timezoneMinutes = packet[42];

    disableSleepRecordCycle = packet[43];

    earliestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 44);
    latestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 48);

    lowerFilterFreq = twoBytesToNumber(packet, 52);
    higherFilterFreq = twoBytesToNumber(packet, 54);

    amplitudeThreshold = twoBytesToNumber(packet, 56);

    /* Display configuration */

    console.log('Current time: ', formatDate(time));

    console.log('Timezone Hours:', timezoneHours);
    console.log('Timezone Minutes:', timezoneMinutes);

    console.log('Gain:', gain);
    console.log('Clock divider:', clockDivider);
    console.log('Acquisition cycles:', acquisitionCycles);
    console.log('Oversample rate:', oversampleRate);
    console.log('Sample rate:', sampleRate);
    console.log('Sample rate divider:', sampleRateDivider);

    console.log('Enable sleep/record cyclic recording:', disableSleepRecordCycle === 0);
    console.log('Sleep duration:', sleepDuration);
    console.log('Recording duration:', recordDuration);

    console.log('Enable LED:', enableLED === 1);
    console.log('Enable low-voltage cutoff:', enableLowVoltageCutoff === 1);
    console.log('Enable battery level indication:', disableBatteryLevelDisplay === 0);

    console.log('Active recording periods:', activeStartStopPeriods);

    for (j = 0; j < activeStartStopPeriods; j++) {

        console.log('Start: ' + formatTime(startStopPeriods[j].startMinutes) + ' - Stop: ' + formatTime(startStopPeriods[j].stopMinutes));

    }

    console.log('Earliest recording time:', formatDate(earliestRecordingTime));
    console.log('Latest recording time:', formatDate(latestRecordingTime));

    console.log('Lower filter value:', lowerFilterFreq);
    console.log('Higher filter value:', higherFilterFreq);

    console.log('Amplitude threshold:', amplitudeThreshold);

};
