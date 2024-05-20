/****************************************************************************
 * packetReader.js
 * openacousticdevices.info
 * April 2020
 *****************************************************************************/

'use strict';

const audiomoth = require('audiomoth-hid');

const constants = require('./constants.js');

function fourBytesToNumber (buffer, offset) {

    return (buffer[offset] & 0xFF) + ((buffer[offset + 1] & 0xFF) << 8) + ((buffer[offset + 2] & 0xFF) << 16) + ((buffer[offset + 3] & 0xFF) << 24);

}

function twoBytesToSignedNumber (buffer, offset) {

    let value = (buffer[offset] & 0xFF) + ((buffer[offset + 1] & 0xFF) << 8);
    value = value >= 32768 ? value - 65536 : value;

    return value;

}

function twoBytesToNumber (buffer, offset) {

    return (buffer[offset] & 0xFF) + ((buffer[offset + 1] & 0xFF) << 8);

}

function digitWithLeadingZero (value) {

    const formattedString = '0' + value;

    return formattedString.substring(formattedString.length - 2);

}

function formatTime (minutes) {

    return digitWithLeadingZero(Math.floor(minutes / constants.MINUTES_IN_HOUR)) + ':' + digitWithLeadingZero(minutes % constants.MINUTES_IN_HOUR);

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
} recordingPeriod_t;

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
    union {
        struct {
            uint8_t activeRecordingPeriods;
            recordingPeriod_t recordingPeriods[MAX_RECORDING_PERIODS];
        };
        struct {
            uint8_t sunRecordingMode : 3;
            uint8_t sunRecordingEvent : 2;
            int16_t latitudeMinutes;
            int16_t longitudeMinutes;
            uint8_t sunRoundingMinutes;
            uint16_t beforeSunriseMinutes : 10;
            uint16_t afterSunriseMinutes : 10;
            uint16_t beforeSunsetMinutes : 10;
            uint16_t afterSunsetMinutes : 10;
        };
    };
    int8_t timeZoneHours;
    uint8_t enableLowVoltageCutoff;
    uint8_t disableBatteryLevelDisplay;
    int8_t timeZoneMinutes;
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
    uint8_t enableSunRecording : 1;
} configSettings_t;

*/

/**
 * Extract four 10-bit numbers from a buffer, starting from a given index
 * @param {buffer} buffer Buffer containing data
 * @param {integer} start Where in the buffer to start looking for the four values
 * @returns An array containing four 10-bit numbers
 */
function fiveBytesToFourNumbers (buffer, start) {

    const byte0 = buffer[start];
    const byte1 = buffer[start + 1];
    const byte2 = buffer[start + 2];
    const byte3 = buffer[start + 3];
    const byte4 = buffer[start + 4];

    const value0 = (byte0 & 0b0011111111) | ((byte1 << 8) & 0b1100000000);
    const value1 = ((byte1 >> 2) & 0b0000111111) | ((byte2 << 6) & 0b1111000000);
    const value2 = ((byte2 >> 4) & 0b0000001111) | ((byte3 << 4) & 0b1111110000);
    const value3 = ((byte3 >> 6) & 0b0000000011) | ((byte4 << 2) & 0b1111111100);

    return [value0, value1, value2, value3];

}

function convertCoordMinsToObject (mins) {

    const positiveDirection = mins > 0;

    mins = Math.abs(mins);

    const degrees = Math.floor(mins / 100);
    const hundredths = mins % 100;

    return {
        degrees,
        hundredths,
        positiveDirection
    };

}

exports.read = (packet) => {

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

    /* Read advanced settings */

    const packedByte3 = packet[61];

    const energySaverModeEnabled = packedByte3 & 1;

    const disable48DCFilter = (packedByte3 >> 1) & 1;

    const timeSettingFromGPSEnabled = (packedByte3 >> 2) & 1;

    const magneticSwitchEnabled = (packedByte3 >> 3) & 1;

    const lowGainRangeEnabled = (packedByte3 >> 4) & 1;

    const enableFrequencyFilter = (packedByte3 >> 5) & 1;

    const dailyFolders = (packedByte3 >> 6) & 1;

    const sunRecordingEnabled = (packedByte3 >> 7) & 1;

    /* Read recording schedule or sunrise/sunset settings */

    let sunMode;
    let sunEvent;
    let latitude, longitude;
    let sunRounding;
    let sunriseBefore, sunriseAfter, sunsetBefore, sunsetAfter;

    let activeRecordingPeriods, recordingPeriods;

    if (sunRecordingEnabled) {

        const packedByte4 = packet[18];

        sunMode = packedByte4 & 0b111;
        sunEvent = (packedByte4 >> 3) & 0b11;

        latitude = convertCoordMinsToObject(twoBytesToSignedNumber(packet, 19));
        longitude = convertCoordMinsToObject(twoBytesToSignedNumber(packet, 21));

        sunRounding = packet[23];

        /* packet[24], packet[25], packet[26], packet[27], packet[28] */
        const numbers = fiveBytesToFourNumbers(packet, 24);

        sunriseBefore = numbers[0];
        sunriseAfter = numbers[1];
        sunsetBefore = numbers[2];
        sunsetAfter = numbers[3];

    } else {

        activeRecordingPeriods = packet[18];

        recordingPeriods = [];

        for (let i = 0; i < activeRecordingPeriods; i += 1) {

            const startMinutes = twoBytesToNumber(packet, 19 + 4 * i);
            const endMinutes = twoBytesToNumber(packet, 21 + 4 * i);

            recordingPeriods.push({startMinutes, endMinutes});

        }

    }

    const timeZoneHours = packet[39] > 127 ? packet[39] - 256 : packet[39];

    /* Low voltage cutoff is now always enabled */

    // const enableLowVoltageCutoff = packet[40];

    const disableBatteryLevelDisplay = packet[41];

    const timeZoneMinutes = packet[42] > 127 ? packet[42] - 256 : packet[42];

    const disableSleepRecordCycle = packet[43];

    const earliestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 44);
    const latestRecordingTime = audiomoth.convertFourBytesFromBufferToDate(packet, 48);

    const lowerFilterFreq = twoBytesToNumber(packet, 52);
    const higherFilterFreq = twoBytesToNumber(packet, 54);

    const packedByte0 = packet[58];

    const requireAcousticConfig = packedByte0 & 1;

    const displayVoltageRange = (packedByte0 >> 1) & 1;

    const minimumTriggerDuration = (packedByte0 >> 2) & 0b111111;

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

    console.log('TimeZone Hours:', timeZoneHours);
    console.log('TimeZone Minutes:', timeZoneMinutes);

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
    console.log('Enable battery level indication:', disableBatteryLevelDisplay === 0);

    if (sunRecordingEnabled) {

        console.log('Sunrise/sunset schedule enabled');

        console.log('\tSun mode:', sunMode);

        const sunDefinitionStrings = ['Sunrise/sunset', 'Civil', 'Nautical', 'Astronomical'];
        console.log('\tSun event:', sunEvent, '-', sunDefinitionStrings[sunEvent]);

        const latitudeDirection = latitude.positiveDirection ? 'N' : 'S';
        console.log('\tLatitude:', latitude.degrees, '.', latitude.hundredths, '°', latitudeDirection);

        const longitudeDirection = longitude.positiveDirection ? 'E' : 'W';
        console.log('\tLongitude:', longitude.degrees, '.', longitude.hundredths, '°', longitudeDirection);

        console.log('\tSun rounding:', sunRounding);

        console.log('\tBefore sunrise mins:', sunriseBefore);
        console.log('\tAfter sunrise mins:', sunriseAfter);
        console.log('\tBefore sunset mins:', sunsetBefore);
        console.log('\tAfter sunset mins:', sunsetAfter);

    } else {

        console.log('Standard schedule enabled');

        console.log('\tActive recording periods:', activeRecordingPeriods);

        for (let j = 0; j < activeRecordingPeriods; j++) {

            const startMins = recordingPeriods[j].startMinutes;
            const endMins = recordingPeriods[j].endMinutes;

            console.log('\tStart: ' + formatTime(startMins) + ' (' + startMins + ') - End: ' + formatTime(endMins) + ' (' + endMins + ')');

        }

    }

    console.log('Earliest recording time:', formatDate(earliestRecordingTime));
    console.log('Latest recording time:', formatDate(latestRecordingTime));

    if (lowerFilterFreq === constants.UINT16_MAX) {

        // Low-pass
        console.log('Low-pass filter set at:', higherFilterFreq / 10, 'kHz');

    } else if (higherFilterFreq === constants.UINT16_MAX) {

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
