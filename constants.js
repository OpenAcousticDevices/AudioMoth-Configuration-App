/****************************************************************************
 * recordingCOnfigurations.js
 * openacousticdevices.info
 * December 2019
 *****************************************************************************/

/* Setting parameters */

exports.configurations = [{
    trueSampleRate: 8,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 48,
    recordCurrent: 9.22,
    energySaverRecordCurrent: 5.92,
    listenCurrent: 8.59,
    energySaverListenCurrent: 5.41
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 24,
    recordCurrent: 9.83,
    energySaverRecordCurrent: 6.63,
    listenCurrent: 8.72,
    energySaverListenCurrent: 5.54
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 12,
    recordCurrent: 11.3,
    energySaverRecordCurrent: 8.04,
    listenCurrent: 8.95,
    energySaverListenCurrent: 5.78
}, {
    trueSampleRate: 48,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8,
    recordCurrent: 12.3,
    energySaverRecordCurrent: 8.93,
    listenCurrent: 9.14,
    energySaverListenCurrent: 5.98
}, {
    trueSampleRate: 96,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4,
    recordCurrent: 15.8,
    energySaverRecordCurrent: 15.8,
    listenCurrent: 10.0,
    energySaverListenCurrent: 10.0
}, {
    trueSampleRate: 192,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2,
    recordCurrent: 24.1,
    energySaverRecordCurrent: 24.1,
    listenCurrent: 11.5,
    energySaverListenCurrent: 11.5
}, {
    trueSampleRate: 250,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 250000,
    sampleRateDivider: 1,
    recordCurrent: 26.4,
    energySaverRecordCurrent: 26.4,
    listenCurrent: 10.6,
    energySaverListenCurrent: 10.6
}, {
    trueSampleRate: 384,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1,
    recordCurrent: 38.5,
    energySaverRecordCurrent: 38.5,
    listenCurrent: 12.7,
    energySaverListenCurrent: 12.7
}];

/* Configuration settings to be used when a device is on firmware < 1.4.4 */
/* Only sent to devices. Not used in energy calculations */

exports.oldConfigurations = [{
    trueSampleRate: 8,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 16
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 8
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 4
}];

/* GPS energy consumption */

exports.GPS_FIX_TIME = 1.0 / 60.0;
exports.GPS_FIX_CONSUMPTION = 30.0;

/* Packet lengths for each version */

exports.packetLengthVersions = [{
    firmwareVersion: '0.0.0',
    packetLength: 39
}, {
    firmwareVersion: '1.2.0',
    packetLength: 40
}, {
    firmwareVersion: '1.2.1',
    packetLength: 42
}, {
    firmwareVersion: '1.2.2',
    packetLength: 43
}, {
    firmwareVersion: '1.4.0',
    packetLength: 58
}, {
    firmwareVersion: '1.5.0',
    packetLength: 59
}, {
    firmwareVersion: '1.6.0',
    packetLength: 62
}];

const FIRMWARE_OFFICIAL_RELEASE = 0;
const FIRMWARE_OFFICIAL_RELEASE_CANDIDATE = 1;
const FIRMWARE_CUSTOM_EQUIVALENT = 2;
const FIRMWARE_UNSUPPORTED = 3;
exports.FIRMWARE_OFFICIAL_RELEASE = FIRMWARE_OFFICIAL_RELEASE;
exports.FIRMWARE_OFFICIAL_RELEASE_CANDIDATE = FIRMWARE_OFFICIAL_RELEASE_CANDIDATE;
exports.FIRMWARE_CUSTOM_EQUIVALENT = FIRMWARE_CUSTOM_EQUIVALENT;
exports.FIRMWARE_UNSUPPORTED = FIRMWARE_UNSUPPORTED;

const EQUIVALENCE_REGEX = /E[0-9]+\.[0-9]+\.[0-9]+/g;
exports.EQUIVALENCE_REGEX = EQUIVALENCE_REGEX;

/* Remove trailing digit and check if description is in list of supported firmware descriptions */

exports.getFirmwareClassification = (desc) => {

    /* If official firmware or a release candidate of the official firmware */

    if (desc === 'AudioMoth-Firmware-Basic') {

        return FIRMWARE_OFFICIAL_RELEASE;

    }

    if (desc.replace(/-RC\d+$/, '-RC') === 'AudioMoth-Firmware-Basic-RC') {

        return FIRMWARE_OFFICIAL_RELEASE_CANDIDATE;

    }

    const foundEquivalence = desc.match(EQUIVALENCE_REGEX);

    if (foundEquivalence) {

        return FIRMWARE_CUSTOM_EQUIVALENT;

    }

    return FIRMWARE_UNSUPPORTED;

};

/* Version number for the latest firmware */

exports.latestFirmwareVersionArray = ['1', '10', '0'];
exports.latestFirmwareVersionString = '1.10.0';

/* Time zone modes */

exports.TIME_ZONE_MODE_UTC = 0;
exports.TIME_ZONE_MODE_LOCAL = 1;
exports.TIME_ZONE_MODE_CUSTOM = 2;
exports.TIME_ZONE_MODE_STRINGS = ['UTC', 'LOCAL', 'CUSTOM'];

/* Calculation values */

exports.UINT32_MAX = 0xFFFFFFFF;
exports.UINT16_MAX = 0xFFFF;

exports.MILLISECONDS_IN_SECOND = 1000;

exports.SECONDS_IN_MINUTE = 60;
exports.SECONDS_IN_DAY = 86400;

exports.MINUTES_IN_HOUR = 60;
exports.MINUTES_IN_DAY = 1440;

/* Schedule limitations */

exports.MAX_PERIODS = 4;

/* Sunrise and sunset results */

exports.SUN_ABOVE_HORIZON = 0;
exports.NORMAL_SOLUTION = 1;
exports.SUN_BELOW_HORIZON = 2;

exports.DAY_LONGER_THAN_NIGHT = 0;
exports.DAY_EQUAL_TO_NIGHT = 1;
exports.DAY_SHORTER_THAN_NIGHT = 2;

exports.MINIMUM_SUN_RECORDING_GAP = 60;
exports.SUN_RECORDING_GAP_MULTIPLIER = 4;

/* Sun schedule modes */

exports.MODE_BEFORE_SUNRISE_AFTER_SUNRISE = 0;
exports.MODE_BEFORE_SUNSET_AFTER_SUNSET = 1;
exports.MODE_BEFORE_BOTH_AFTER_BOTH = 2;
exports.MODE_BEFORE_SUNSET_AFTER_SUNRISE = 3;
exports.MODE_BEFORE_SUNRISE_AFTER_SUNSET = 4;

/* Sun events modes */

exports.SUNRISE_AND_SUNSET = 0;
exports.CIVIL_DAWN_AND_DUSK = 1;
exports.NAUTICAL_DAWN_AND_DUSK = 2;
exports.ASTRONOMICAL_DAWN_AND_DUSK = 3;

/* First/last recording date range */

exports.MIN_FIRST_LAST_DATE = '2020-01-01';
exports.MAX_FIRST_LAST_DATE = '2029-12-31';
