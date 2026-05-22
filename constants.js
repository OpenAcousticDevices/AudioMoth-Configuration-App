/****************************************************************************
 * recordingCOnfigurations.js
 * openacousticdevices.info
 * December 2019
 *****************************************************************************/

/* Setting parameters */

exports.CONFIGURATIONS = [{
    trueSampleRate: 8,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 48,
    recordCurrent: 8.5,
    energySaverRecordCurrent: 5.5,
    listenCurrent: 8.1,
    energySaverListenCurrent: 5.1
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 24,
    recordCurrent: 9.0,
    energySaverRecordCurrent: 6.0,
    listenCurrent: 8.1,
    energySaverListenCurrent: 5.2
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 12,
    recordCurrent: 10.0,
    energySaverRecordCurrent: 7.0,
    listenCurrent: 8.2,
    energySaverListenCurrent: 5.4
}, {
    trueSampleRate: 48,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8,
    recordCurrent: 10.5,
    energySaverRecordCurrent: 7.5,
    listenCurrent: 8.4,
    energySaverListenCurrent: 5.6
}, {
    trueSampleRate: 96,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4,
    recordCurrent: 13.5,
    energySaverRecordCurrent: 13.5,
    listenCurrent: 9.0,
    energySaverListenCurrent: 9.0
}, {
    trueSampleRate: 192,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2,
    recordCurrent: 20.0,
    energySaverRecordCurrent: 20.0,
    listenCurrent: 10.5,
    energySaverListenCurrent: 10.5
}, {
    trueSampleRate: 250,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 250000,
    sampleRateDivider: 1,
    recordCurrent: 17.0,
    energySaverRecordCurrent: 17.0,
    listenCurrent: 10.0,
    energySaverListenCurrent: 10.0
}, {
    trueSampleRate: 384,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1,
    recordCurrent: 24.0,
    energySaverRecordCurrent: 24.0,
    listenCurrent: 12.5,
    energySaverListenCurrent: 12.5
}];

/* Configuration settings to be used when a device is on firmware < 1.4.4 */
/* Only sent to devices. Not used in energy calculations */

exports.OLD_CONFIGURATIONS = [{
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

exports.GPS_FIX_TIME = 0.5 / 60.0;
exports.GPS_FIX_CONSUMPTION = 30.0;

exports.MINIMUM_GPS_FIX_TIME = 30;

/* Packet lengths for each version */

exports.PACKET_LENGTH_VERSIONS = [{
    firmwareVersion: [0, 0, 0],
    packetLength: 39
}, {
    firmwareVersion: [1, 2, 0],
    packetLength: 40
}, {
    firmwareVersion: [1, 2, 1],
    packetLength: 42
}, {
    firmwareVersion: [1, 2, 2],
    packetLength: 43
}, {
    firmwareVersion: [1, 4, 0],
    packetLength: 58
}, {
    firmwareVersion: [1, 5, 0],
    packetLength: 59
}, {
    firmwareVersion: [1, 6, 0],
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

/**
 * @returns -1: A < B, 0: A === B, 1: A > B
 */
function compareSemanticVersion (version, major, minor, patch) {

    for (let i = 0; i < 3; i++) {

        const versionNumber = parseInt(version[i]);

        const comparator = i === 0 ? major : i === 1 ? minor : patch;

        if (versionNumber > comparator) {

            return 1;

        } else if (versionNumber < comparator) {

            return -1;

        }

    }

    return 0;

}

exports.compareSemanticVersion = compareSemanticVersion;

exports.isOlderSemanticVersion = (version, major, minor, patch) => {

    return compareSemanticVersion(version, major, minor, patch) === -1;

};

exports.isNewerSemanticVersion = (version, major, minor, patch) => {

    return compareSemanticVersion(version, major, minor, patch) === 1;

};

exports.isSameSemanticVersion = (version, major, minor, patch) => {

    return compareSemanticVersion(version, major, minor, patch) === 0;

};

exports.isOlderOrEqualSemanticVersion = (version, major, minor, patch) => {

    const comparisonResult = compareSemanticVersion(version, major, minor, patch);

    return comparisonResult === -1 || comparisonResult === 0;

};

exports.isNewerOrEqualSemanticVersion = (version, major, minor, patch) => {

    const comparisonResult = compareSemanticVersion(version, major, minor, patch);

    return comparisonResult === 0 || comparisonResult === 1;

};

/* Version number for the latest firmware */

const LATEST_FIRMWARE_VERSION_MAJOR = 1;
const LATEST_FIRMWARE_VERSION_MINOR = 12;
const LATEST_FIRMWARE_VERSION_PATCH = 0;

exports.LATEST_FIRMWARE_VERSION_MAJOR = LATEST_FIRMWARE_VERSION_MAJOR;
exports.LATEST_FIRMWARE_VERSION_MINOR = LATEST_FIRMWARE_VERSION_MINOR;
exports.LATEST_FIRMWARE_VERSION_PATCH = LATEST_FIRMWARE_VERSION_PATCH;
exports.LATEST_FIRMWARE_VERSION_ARRAY = [LATEST_FIRMWARE_VERSION_MAJOR, LATEST_FIRMWARE_VERSION_MINOR, LATEST_FIRMWARE_VERSION_PATCH];
exports.LATEST_FIRMWARE_VERSION_STRING = LATEST_FIRMWARE_VERSION_MAJOR.toString() + '.' + LATEST_FIRMWARE_VERSION_MINOR.toString() + '.' + LATEST_FIRMWARE_VERSION_PATCH.toString();

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

/* Valid settings */

exports.VALID_GAIN_VALUES = [0, 1, 2, 3, 4];
exports.MAX_SLEEP_DURATION = 43200;
exports.MAX_RECORD_DURATION = 43200;
exports.MIN_CUSTOM_TIME_ZONE_OFFSET = -720;
exports.MAX_CUSTOM_TIME_ZONE_OFFSET = 840
exports.MAX_AMPLITUDE_THRESHOLD_PERCENTAGE = 100;
exports.MAX_AMPLITUDE_THRESHOLD_16BIT = 32768;
exports.MIN_AMPLITUDE_THRESHOLD_DECIBEL = -100;
exports.MAX_AMPLITUDE_THRESHOLD_DECIBEL = 0;
exports.VALID_GPS_FIX_TIMES = [1, 2, 5, 10, 15];
