/****************************************************************************
 * packetReader.js
 * openacousticdevices.info
 * April 2020
 *****************************************************************************/

'use strict';

const audiomoth = require('audiomoth-hid');

const UINT16_MAX = 0xFFFF;

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
    AM_gainSetting_t gain;
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
    union {
        uint16_t amplitudeThreshold;
        uint16_t goertzelFilterFrequency;
    };
    uint8_t requireAcousticConfiguration : 1;
    AM_batteryLevelDisplayType_t batteryLevelDisplayType : 1;
    uint8_t minimumTriggerDuration : 6;
    union {
        struct {
            uint8_t goertzelFilterWindowLengthShift : 4;
            uint8_t goertzelFilterThresholdPercentageMantissa : 4;
            int8_t goertzelFilterThresholdPercentageExponent : 3;
        };
        struct {
            uint8_t enableAmplitudeThresholdDecibelScale : 1;
            uint8_t amplitudeThresholdDecibels : 7;
            uint8_t enableAmplitudeThresholdPercentageScale : 1;
            uint8_t amplitudeThresholdPercentageMantissa : 4;
            int8_t amplitudeThresholdPercentageExponent : 3;
        };
    };
    uint8_t enableEnergySaverMode : 1;
    uint8_t disable48HzDCBlockingFilter : 1;
    uint8_t enableTimeSettingFromGPS : 1;
    uint8_t enableMagneticSwitch : 1;
    uint8_t enableLowGainRange : 1;
    uint8_t enableGoertzelFilter : 1;
    uint8_t enableDailyFolders : 1;
} configSettings_t;

*/

exports.read = (packet) => {

    let startMinutes, stopMinutes;

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

    const packedByte0 = packet[58];

    const requireAcousticConfig = packedByte0 & 1;

    const displayVoltageRange = (packedByte0 >> 1) & 1;

    const minimumTriggerDuration = (packedByte0 >> 2) & 0b111111;

    /* Read remaining settings */

    const packedByte3 = packet[61];

    const energySaverModeEnabled = packedByte3 & 1;

    const disable48DCFilter = (packedByte3 >> 1) & 1;

    const timeSettingFromGPSEnabled = (packedByte3 >> 2) & 1;

    const magneticSwitchEnabled = (packedByte3 >> 3) & 1;

    const lowGainRangeEnabled = (packedByte3 >> 4) & 1;

    const enableFrequencyFilter = (packedByte3 >> 5) & 1;

    const dailyFolders = (packedByte3 >> 6) & 1;

    /* Indices contain either amplitude or frequency threshold, so use enableFrequencyFilter to tell which is which */

    const packedByte1 = packet[59];
    const packedByte2 = packet[60];

    let amplitudeThreshold = 0;
    let goertzelFilterFrequency = 0;

    let goertzelFilterWindowLengthShift, goertzelFilterThresholdPercentageMantissa, goertzelFilterThresholdPercentageExponent, goertzelFilterThresholdPercentage;

    let enableAmplitudeThresholdDecibelScale, amplitudeThresholdDecibel;
    let enableAmplitudeThresholdPercentageScale, amplitudeThresholdPercentageMantissa, amplitudeThresholdPercentageExponent, amplitudeThresholdPercentage, amplitudeThresholdScale;

    if (enableFrequencyFilter) {

        goertzelFilterFrequency = twoBytesToNumber(packet, 56);
        goertzelFilterFrequency *= 100;

        /* Frequency threshold */

        goertzelFilterWindowLengthShift = packedByte1 & 0b1111;
        goertzelFilterWindowLengthShift = 1 << goertzelFilterWindowLengthShift;

        goertzelFilterThresholdPercentageMantissa = (packedByte1 >> 4) & 0b1111;

        goertzelFilterThresholdPercentageExponent = packedByte2 & 0b111;
        goertzelFilterThresholdPercentageExponent = goertzelFilterThresholdPercentageExponent < 0b100 ? goertzelFilterThresholdPercentageExponent : goertzelFilterThresholdPercentageExponent - 0b1000;

        goertzelFilterThresholdPercentage = goertzelFilterThresholdPercentageMantissa * Math.pow(10, goertzelFilterThresholdPercentageExponent);

    } else {

        amplitudeThreshold = twoBytesToNumber(packet, 56);

        /* Amplitude threshold decibel scale */

        /* Read bottom 7 bits */

        enableAmplitudeThresholdDecibelScale = packedByte1 & 1;

        amplitudeThresholdDecibel = -1 * ((packedByte1 >> 1) & 0b1111111);

        /* Amplitude threshold percentage scale */

        enableAmplitudeThresholdPercentageScale = packedByte2 & 1;

        /* Read the percentage value as a 4-bit mantissa and a 3-bit exponent */

        amplitudeThresholdPercentageMantissa = (packedByte2 >> 1) & 0b1111;

        /* Read final 3 bits and read as 3-bit two's complement */

        amplitudeThresholdPercentageExponent = (packedByte2 >> 5) & 0b111;
        amplitudeThresholdPercentageExponent = amplitudeThresholdPercentageExponent < 0b100 ? amplitudeThresholdPercentageExponent : amplitudeThresholdPercentageExponent - 0b1000;

        amplitudeThresholdPercentage = formatPercentage(amplitudeThresholdPercentageMantissa, amplitudeThresholdPercentageExponent) + '%';

        /* Which amplitude threshold scale should be displayed */

        if (enableAmplitudeThresholdPercentageScale === 1 && enableAmplitudeThresholdDecibelScale === 0) {

            amplitudeThresholdScale = 'Percentage';

        } else if (enableAmplitudeThresholdDecibelScale === 1 && enableAmplitudeThresholdPercentageScale === 0) {

            amplitudeThresholdScale = 'Decibel';

        } else {

            amplitudeThresholdScale = '16-Bit';

        }

    }

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

    for (let j = 0; j < activeStartStopPeriods; j++) {

        console.log('Start: ' + formatTime(startStopPeriods[j].startMinutes) + ' - Stop: ' + formatTime(startStopPeriods[j].stopMinutes));

    }

    console.log('Earliest recording time:', formatDate(earliestRecordingTime));
    console.log('Latest recording time:', formatDate(latestRecordingTime));

    if (lowerFilterFreq === UINT16_MAX) {

        // Low-pass
        console.log('Low-pass filter set at:', higherFilterFreq / 10, 'kHz');

    } else if (higherFilterFreq === UINT16_MAX) {

        // High-pass
        console.log('High-pass filter set at:', lowerFilterFreq / 10, 'kHz');

    } else if (lowerFilterFreq === 0 && higherFilterFreq === 0) {

        // None
        console.log('Frequency filter disabled');

    } else {

        // Band-pass
        console.log('Band-pass filter set at:', lowerFilterFreq / 10, 'kHz -', higherFilterFreq / 10, 'kHz');

    }

    console.log('Minimum trigger duration:', minimumTriggerDuration);

    if (enableFrequencyFilter) {

        console.log('Goertzel filter window length:', goertzelFilterWindowLengthShift);

        console.log('Goertzel filter frequency:', goertzelFilterFrequency / 1000, 'kHz');

        console.log('Frequency filter threshold mantissa:', goertzelFilterThresholdPercentageMantissa);

        console.log('Frequency filter threshold exponent:', goertzelFilterThresholdPercentageExponent);

        console.log('Frequency filter threshold:', goertzelFilterThresholdPercentage);

    } else {

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

    }

    console.log('Acoustic configuration required:', requireAcousticConfig === 1);

    console.log('Use NiMH/LiPo voltage range for battery level indication:', displayVoltageRange === 1);

    console.log('Energy saver mode enabled:', energySaverModeEnabled === 1);

    console.log('48 Hz DC blocking filter disabled:', disable48DCFilter === 1);

    console.log('GPS clock setting enabled:', timeSettingFromGPSEnabled === 1);

    console.log('Magnetic switch delay enabled:', magneticSwitchEnabled === 1);

    console.log('Low gain range enabled: ', lowGainRangeEnabled === 1);

    console.log('Daily folders enabled:', dailyFolders === 1);

};
