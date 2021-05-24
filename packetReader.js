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

    const formattedString = '0' + value;

    return formattedString.substring(formattedString.length - 2);

}

function formatTime (minutes) {

    return digitWithLeadingZero(Math.floor(minutes / 60)) + ':' + digitWithLeadingZero(minutes % 60);

}

function formatDate (date) {

    return (date.valueOf() / 1000) + ' - ' + date.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' (UTC)';

}

function formatPercentage (mantissa, exponent) {

    let response = '';

    if (exponent < 0) {

        response += '0.0000'.substring(0, 1 - exponent);

    }

    response += mantissa;

    for (let i = 0; i < exponent; i += 1) response += '0';

    return response;

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
    uint8_t requireAcousticConfiguration;
    AM_batteryLevelDisplayType_t batteryLevelDisplayType;
    uint8_t minimumAmplitudeThresholdDuration;
    uint8_t enableAmplitudeThresholdDecibelScale : 1;
    uint8_t amplitudeThresholdDecibels : 7;
    uint8_t enableAmplitudeThresholdPercentageScale : 1;
    uint8_t amplitudeThresholdPercentageMantissa : 4;
    int8_t amplitudeThresholdPercentageExponent : 3;
} configSettings_t;

*/

exports.read = (packet) => {

    let startMinutes, stopMinutes;
    // , amplitudeThresholdPercentageExponent, amplitudeThresholdPercentageMantissa, amplitudeThresholdPercentage, enableAmplitudeThresholdPercentageScale, amplitudeThresholdDecibel, amplitudeThresholdScale;

    /* Read and decode configuration packet */

    const time = audiomoth.convertFourBytesFromBufferToDate(packet, 0);

    const gain = packet[4];
    const clockDivider = packet[5];
    const acquisitionCycles = packet[6];
    const oversampleRate = packet[7];

    const sampleRate = fourBytesToNumber(packet, 8);
    const sampleRateDivider = packet[12];

    const sleepDuration = twoBytesToNumber(packet, 13);
    const recordDuration = twoBytesToNumber(packet, 15);

    const enableLED = packet[17];

    const activeStartStopPeriods = packet[18];
    const startStopPeriods = [];

    for (let i = 0; i < activeStartStopPeriods; i += 1) {

        startMinutes = twoBytesToNumber(packet, 19 + 4 * i);
        stopMinutes = twoBytesToNumber(packet, 21 + 4 * i);

        startStopPeriods.push({startMinutes: startMinutes, stopMinutes: stopMinutes});

    }

    const timezoneHours = packet[39];

    const enableLowVoltageCutoff = packet[40];
    const disableBatteryLevelDisplay = packet[41];

    const timezoneMinutes = packet[42];

    const disableSleepRecordCycle = packet[43];

    const earliestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 44);
    const latestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 48);

    const lowerFilterFreq = twoBytesToNumber(packet, 52);
    const higherFilterFreq = twoBytesToNumber(packet, 54);

    const amplitudeThreshold = twoBytesToNumber(packet, 56);

    const packedByte0 = packet[58];

    const requireAcousticConfig = packedByte0 & 1;

    const displayVoltageRange = (packedByte0 >> 1) & 1;

    const minimumAmplitudeThresholdDuration = (packedByte0 >> 2) & 0b111111;

    /* Amplitude threshold decibel scale */

    const packedByte1 = packet[59];

    /* Read bottom 7 bits */

    const enableAmplitudeThresholdDecibelScale = packedByte1 & 1;

    const amplitudeThresholdDecibel = -1 * ((packedByte1 >> 1) & 0b1111111);

    /* Amplitude threshold percentage scale */

    const packedByte2 = packet[60];

    const enableAmplitudeThresholdPercentageScale = packedByte2 & 1;

    /* Read the percentage value as a 4-bit mantissa and a 3-bit exponent */

    const amplitudeThresholdPercentageMantissa = (packedByte2 >> 1) & 0b1111;

    /* Read final 3 bits and read as 3-bit two's complement */

    let amplitudeThresholdPercentageExponent = (packedByte2 >> 5) & 0b111;
    amplitudeThresholdPercentageExponent = amplitudeThresholdPercentageExponent < 0b100 ? amplitudeThresholdPercentageExponent : amplitudeThresholdPercentageExponent - 0b1000;

    const amplitudeThresholdPercentage = formatPercentage(amplitudeThresholdPercentageMantissa, amplitudeThresholdPercentageExponent) + '%';

    /* Which amplitude threshold scale should be displayed */

    let amplitudeThresholdScale;

    if (enableAmplitudeThresholdPercentageScale === 1 && enableAmplitudeThresholdDecibelScale === 0) {

        amplitudeThresholdScale = 'Percentage';

    } else if (enableAmplitudeThresholdDecibelScale === 1 && enableAmplitudeThresholdPercentageScale === 0) {

        amplitudeThresholdScale = 'Decibel';

    } else {

        amplitudeThresholdScale = '16-Bit';

    }

    const packedByte3 = packet[61];

    const energySaverModeEnabled = packedByte3 & 1;

    const disable48DCFilter = (packedByte3 >> 1) & 1;

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

    for (let j = 0; j < activeStartStopPeriods.length; j++) {

        console.log('Start: ' + formatTime(startStopPeriods[j].startMinutes) + ' - Stop: ' + formatTime(startStopPeriods[j].stopMinutes));

    }

    console.log('Earliest recording time:', formatDate(earliestRecordingTime));
    console.log('Latest recording time:', formatDate(latestRecordingTime));

    console.log('Lower filter value:', lowerFilterFreq);
    console.log('Higher filter value:', higherFilterFreq);

    console.log('Amplitude threshold percentage flag:', (enableAmplitudeThresholdPercentageScale === 1));
    console.log('Amplitude threshold decibel flag:', (enableAmplitudeThresholdDecibelScale === 1));

    console.log('Amplitude threshold (16-bit):', amplitudeThreshold);

    if (amplitudeThresholdScale === 'Percentage') {

        console.log('Percentage exponent:', amplitudeThresholdPercentageExponent);
        console.log('Percentage mantissa:', amplitudeThresholdPercentageMantissa);
        console.log('Amplitude threshold (percentage):', amplitudeThresholdPercentage);

    } else if (amplitudeThresholdScale === 'Decibel') {

        console.log('Amplitude threshold (decibels):', amplitudeThresholdDecibel);

    }

    console.log('Displayed amplitude threshold scale:', amplitudeThresholdScale);

    console.log('Minimum amplitude threshold duration:', minimumAmplitudeThresholdDuration);

    console.log('Acoustic configuration required:', requireAcousticConfig === 1);

    console.log('Use NiMH/LiPo voltage range for battery level indication:', displayVoltageRange === 1);

    console.log('Energy saver mode enabled:', energySaverModeEnabled === 1);

    console.log('48 Hz DC blocking filter disabled:', disable48DCFilter === 1);

};
