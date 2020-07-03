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
    sampleRate: 256000,
    sampleRateDivider: 32,
    current: 10.5
}, {
    trueSampleRate: 16,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 16,
    current: 12.0
}, {
    trueSampleRate: 32,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 8,
    current: 12.5
}, {
    trueSampleRate: 48,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 8,
    current: 13.5
}, {
    trueSampleRate: 96,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 4,
    current: 17.5
}, {
    trueSampleRate: 192,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 2,
    current: 24.5
}, {
    trueSampleRate: 256,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 256000,
    sampleRateDivider: 1,
    current: 30.0
}, {
    trueSampleRate: 384,
    clockDivider: 4,
    acquisitionCycles: 16,
    oversampleRate: 1,
    sampleRate: 384000,
    sampleRateDivider: 1,
    current: 39.0
}];

/* Packet lengths for each version */

exports.packetLengthVersions = [{
    firmwareVersion: '< 1.2.0',
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
