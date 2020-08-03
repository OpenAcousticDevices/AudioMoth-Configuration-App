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
    startCurrent: 11.0,
    recordCurrent: 10.0
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 24,
    startCurrent: 11.2,
    recordCurrent: 10.9
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 12,
    startCurrent: 11.5,
    recordCurrent: 12.3
}, {
    trueSampleRate: 48,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8,
    startCurrent: 11.8,
    recordCurrent: 14.0
}, {
    trueSampleRate: 96,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4,
    startCurrent: 12.7,
    recordCurrent: 17.4
}, {
    trueSampleRate: 192,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2,
    startCurrent: 14.5,
    recordCurrent: 25.6
}, {
    trueSampleRate: 250,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 250000,
    sampleRateDivider: 1,
    startCurrent: 15.8,
    recordCurrent: 29.5
}, {
    trueSampleRate: 384,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1,
    startCurrent: 18.2,
    recordCurrent: 41.6
}];

/* Configuration settings to be used when a device is on firmware < 1.4.4 */

exports.oldConfigurations = [{
    trueSampleRate: 8,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 16,
    startCurrent: 11.0,
    recordCurrent: 10.0
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 8,
    startCurrent: 11.2,
    recordCurrent: 10.9
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 128000,
    sampleRateDivider: 4,
    startCurrent: 11.5,
    recordCurrent: 12.3
}];

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
}];
