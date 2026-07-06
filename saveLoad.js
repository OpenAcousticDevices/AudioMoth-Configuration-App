/****************************************************************************
 * saveLoad.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

const {dialog, BrowserWindow, app} = require('@electron/remote');

const fs = require('fs');
const Validator = require('jsonschema').Validator;

const constants = require('./constants.js');
const ui = require('./ui.js');

const DEFAULT_SETTINGS = {
    timePeriods: [],
    ledEnabled: true,
    batteryLevelCheckEnabled: true,
    sampleRate: 48000,
    gain: 2,
    recordDuration: 55,
    sleepDuration: 5,
    timeZoneMode: 'UTC',
    firstRecordingDateEnabled: false,
    lastRecordingDateEnabled: false,
    dutyEnabled: true,
    filenameWithDeviceIDEnabled: false,
    passFiltersEnabled: false,
    lowerFilter: 6000,
    higherFilter: 18000,
    amplitudeThresholdingEnabled: false,
    amplitudeThreshold: 0.001,
    frequencyTriggerEnabled: false,
    frequencyTriggerWindowLength: 16,
    frequencyTriggerCentreFrequency: 0,
    minimumFrequencyTriggerDuration: 0,
    frequencyTriggerThreshold: 0.001,
    requireAcousticConfig: false,
    requireLocationInChime: false,
    useTimeZoneInChime: false,
    adjustScheduleUsingTimezoneFromAcousticChime: false,
    prerecordingPrepTime: 2,
    dailyFolders: false,
    displayVoltageRange: false,
    minimumAmplitudeThresholdDuration: 0,
    amplitudeThresholdScale: 'percentage',
    energySaverModeEnabled: false,
    lowGainRangeEnabled: false,
    disable48DCFilter: false,
    timeSettingFromGPSEnabled: false,
    acquireGpsFixBeforeAfter: 'period',
    gpsFixTime: 2,
    ignoreExternalMicrophoneForAcousticChime: false,
    magneticSwitchEnabled: false,
    sunScheduleEnabled: false,
    latitude: {
        degrees: 0,
        hundredths: 0,
        positiveDirection: true
    },
    longitude: {
        degrees: 0,
        hundredths: 0,
        positiveDirection: true
    },
    sunMode: 2,
    sunPeriods: {
        sunriseBefore: 60,
        sunriseAfter: 60,
        sunsetBefore: 60,
        sunsetAfter: 60
    },
    sunRounding: 5,
    sunDefinition: 0
};

/* Save configuration settings in UI to .config file */

function saveConfiguration (currentConfig, callback) {

    const sampleRate = constants.CONFIGURATIONS[currentConfig.sampleRateIndex].trueSampleRate * 1000;

    const filterType = currentConfig.filterType;

    let amplitudeThresholdScale;

    switch (currentConfig.amplitudeThresholdScaleIndex) {

    case 0:
        amplitudeThresholdScale = 'percentage';
        break;
    case 1:
        amplitudeThresholdScale = '16bit';
        break;
    case 2:
        amplitudeThresholdScale = 'decibel';
        break;

    }

    const versionString = app.getVersion();

    let configuration = '{\r\n';
    configuration += '"timePeriods": ' + JSON.stringify(currentConfig.timePeriods) + ',\r\n';
    configuration += '"ledEnabled": ' + currentConfig.ledEnabled + ',\r\n';

    /* Low voltage cutoff is always enabled, include this line so files created by newer versions of the app have the same functionality when loaded in older versions */
    configuration += '"lowVoltageCutoffEnabled": ' + true + ',\r\n';

    configuration += '"batteryLevelCheckEnabled": ' + currentConfig.batteryLevelCheckEnabled + ',\r\n';
    configuration += '"sampleRate": ' + sampleRate + ',\r\n';
    configuration += '"gain": ' + currentConfig.gain + ',\r\n';
    configuration += '"recordDuration": ' + currentConfig.recordDuration + ',\r\n';
    configuration += '"sleepDuration": ' + currentConfig.sleepDuration + ',\r\n';

    configuration += ui.getTimeZoneMode() === constants.TIME_ZONE_MODE_CUSTOM ? '"customTimeZoneOffset": ' + currentConfig.customTimeZoneOffset + ',\r\n' : '';

    configuration += '"localTime": ' + currentConfig.localTime + ',\r\n';

    configuration += '"firstRecordingDateEnabled": ' + currentConfig.firstRecordingDateEnabled + ',\r\n';
    configuration += '"lastRecordingDateEnabled": ' + currentConfig.lastRecordingDateEnabled + ',\r\n';

    configuration += currentConfig.firstRecordingDateEnabled ? '"firstRecordingDate": \"' + currentConfig.firstRecordingDate + '\",\r\n' : '';
    configuration += currentConfig.lastRecordingDateEnabled ? '"lastRecordingDate": \"' + currentConfig.lastRecordingDate + '\",\r\n' : '';

    configuration += '"dutyEnabled": ' + currentConfig.dutyEnabled + ',\r\n';
    configuration += '"filenameWithDeviceIDEnabled": ' + currentConfig.filenameWithDeviceIDEnabled + ',\r\n';
    configuration += '"passFiltersEnabled": ' + currentConfig.passFiltersEnabled + ',\r\n';

    configuration += '"filterType": \"' + filterType + '\",\r\n';

    configuration += '"lowerFilter": ' + currentConfig.lowerFilter + ',\r\n';
    configuration += '"higherFilter": ' + currentConfig.higherFilter + ',\r\n';
    configuration += '"amplitudeThresholdingEnabled": ' + currentConfig.amplitudeThresholdingEnabled + ',\r\n';
    configuration += '"amplitudeThreshold": ' + currentConfig.amplitudeThreshold + ',\r\n';
    configuration += '"minimumAmplitudeThresholdDuration": ' + currentConfig.minimumAmplitudeThresholdDuration + ',\r\n';
    configuration += '"frequencyTriggerEnabled": ' + currentConfig.frequencyTriggerEnabled + ',\r\n';
    configuration += '"frequencyTriggerWindowLength": ' + currentConfig.frequencyTriggerWindowLength + ',\r\n';
    configuration += '"frequencyTriggerCentreFrequency": ' + currentConfig.frequencyTriggerCentreFrequency + ',\r\n';
    configuration += '"minimumFrequencyTriggerDuration": ' + currentConfig.minimumFrequencyTriggerDuration + ',\r\n';
    configuration += '"frequencyTriggerThreshold": ' + currentConfig.frequencyTriggerThreshold + ',\r\n';
    configuration += '"requireAcousticConfig": ' + currentConfig.requireAcousticConfig + ',\r\n';
    configuration += '"requireLocationInChime": ' + currentConfig.requireLocationInChime + ',\r\n';
    configuration += '"useTimeZoneInChime": ' + currentConfig.useTimeZoneInChime + ',\r\n';
    configuration += '"adjustScheduleUsingTimezoneFromAcousticChime": ' + currentConfig.adjustScheduleUsingTimezoneFromAcousticChime + ',\r\n';
    configuration += '"prerecordingPrepTime": ' + currentConfig.prerecordingPrepTime + ',\r\n';
    configuration += '"dailyFolders": ' + currentConfig.dailyFolders + ',\r\n';
    configuration += '"displayVoltageRange": ' + currentConfig.displayVoltageRange + ',\r\n';
    configuration += '"amplitudeThresholdScale": \"' + amplitudeThresholdScale + '\",\r\n';
    configuration += '"version": \"' + versionString + '\",\r\n';
    configuration += '"energySaverModeEnabled": ' + currentConfig.energySaverModeEnabled + ',\r\n';
    configuration += '"disable48DCFilter": ' + currentConfig.disable48DCFilter + ',\r\n';
    configuration += '"lowGainRangeEnabled": ' + currentConfig.lowGainRangeEnabled + ',\r\n';
    configuration += '"timeSettingFromGPSEnabled": ' + currentConfig.timeSettingFromGPSEnabled + ',\r\n';
    configuration += '"gpsFixTime": ' + currentConfig.gpsFixTime + ',\r\n';
    configuration += '"ignoreExternalMicrophoneForAcousticChime": ' + currentConfig.ignoreExternalMicrophoneForAcousticChime + ',\r\n';
    configuration += '"acquireGpsFixBeforeAfter": \"' + currentConfig.acquireGpsFixBeforeAfter + '\",\r\n';
    configuration += '"magneticSwitchEnabled": ' + currentConfig.magneticSwitchEnabled + ',\r\n';

    configuration += '"sunScheduleEnabled": ' + currentConfig.sunScheduleEnabled;

    if (currentConfig.sunScheduleEnabled) {

        configuration += ',\r\n';

        configuration += '"latitude": ' + JSON.stringify(currentConfig.latitude) + ',\r\n';
        configuration += '"longitude": ' + JSON.stringify(currentConfig.longitude) + ',\r\n';

        configuration += '"sunMode": ' + currentConfig.sunMode + ',\r\n';
        configuration += '"sunPeriods": ' + JSON.stringify(currentConfig.sunPeriods) + ',\r\n';

        configuration += '"sunRounding": ' + currentConfig.sunRounding + ',\r\n';

        configuration += '"sunDefinition": ' + currentConfig.sunDefinition + '\r\n';

    } else {

        configuration += '\r\n';

    }

    configuration += '}';

    const fileName = dialog.showSaveDialogSync({
        title: 'Save configuration',
        nameFieldLabel: 'Configuration name',
        defaultPath: 'AudioMoth.config',
        filters: [{
            name: 'config',
            extensions: ['config']
        }]
    });

    if (fileName) {

        fs.writeFile(fileName, configuration, callback);

    }

}

exports.saveConfiguration = saveConfiguration;

/* Newer save files save the sample rate itself rather than the index, handle that by detecting empty JSON objects */

function getSampleRateIndex (jsonSampleRateIndex, jsonSampleRate, replacementSampleRate) {

    if (typeof jsonSampleRateIndex === 'undefined') {

        let sampleRate = jsonSampleRate;

        if (typeof jsonSampleRate === 'undefined') {

            sampleRate = replacementSampleRate;

        }

        sampleRate /= 1000;

        let minDistance = -1;
        let closestIndex = 0;

        for (let i = 0; i < constants.CONFIGURATIONS.length; i++) {

            const distance = Math.abs(constants.CONFIGURATIONS[i].trueSampleRate - sampleRate);

            if (minDistance === -1 || distance < minDistance) {

                minDistance = distance;
                closestIndex = i;

            }

        }

        return closestIndex;

    } else {

        return jsonSampleRateIndex;

    }

}

/* Take data obtained from a loaded .config file and duplicate settings in the UI */

function useLoadedConfiguration (err, currentConfig, data, callback) {

    if (err) {

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'error',
            title: 'Load failed',
            message: 'Configuration file could not be loaded.'
        });

        console.error(err);

    } else {

        /* Validate JSON */

        try {

            const jsonObj = JSON.parse(data);
            const validator = new Validator();
            const schema = {
                id: '/configuration',
                type: 'object',
                properties: {
                    timePeriods: {
                        type: 'array',
                        items: {
                            properties: {
                                startMins: {
                                    type: 'integer'
                                },
                                endMins: {
                                    type: 'integer'
                                }
                            },
                            required: ['startMins', 'endMins']
                        }
                    },
                    ledEnabled: {
                        type: 'boolean'
                    },
                    batteryCheckEnabled: {
                        type: 'boolean'
                    },
                    batteryLevelCheckEnabled: {
                        type: 'boolean'
                    },
                    sampleRateIndex: {
                        type: 'integer'
                    },
                    sampleRate: {
                        type: 'integer'
                    },
                    gainIndex: {
                        type: 'integer'
                    },
                    gain: {
                        type: 'integer'
                    },
                    recDuration: {
                        type: 'integer'
                    },
                    recordDuration: {
                        type: 'integer'
                    },
                    sleepDuration: {
                        type: 'integer'
                    },
                    localTime: {
                        type: 'boolean'
                    },
                    customTimeZoneOffset: {
                        type: 'integer'
                    },
                    firstRecordingDateEnabled: {
                        type: 'boolean'
                    },
                    firstRecordingDate: {
                        type: 'string'
                    },
                    lastRecordingDateEnabled: {
                        type: 'boolean'
                    },
                    lastRecordingDate: {
                        type: 'string'
                    },
                    dutyEnabled: {
                        type: 'boolean'
                    },
                    filenameWithDeviceIDEnabled: {
                        type: 'boolean'
                    },
                    passFiltersEnabled: {
                        type: 'boolean'
                    },
                    filterType: {
                        type: 'string'
                    },
                    lowerFilter: {
                        type: 'integer'
                    },
                    higherFilter: {
                        type: 'integer'
                    },
                    amplitudeThresholdingEnabled: {
                        type: 'boolean'
                    },
                    amplitudeThreshold: {
                        type: 'number'
                    },
                    frequencyTriggerEnabled: {
                        type: 'boolean'
                    },
                    frequencyTriggerWindowLength: {
                        type: 'number'
                    },
                    frequencyTriggerCentreFrequency: {
                        type: 'number'
                    },
                    minimumFrequencyTriggerDuration: {
                        type: 'number'
                    },
                    frequencyTriggerThreshold: {
                        type: 'number'
                    },
                    requireAcousticConfig: {
                        type: 'boolean'
                    },
                    requireLocationInChime: {
                        type: 'boolean'
                    },
                    useTimeZoneInChime: {
                        type: 'boolean'
                    },
                    adjustScheduleUsingTimezoneFromAcousticChime: {
                        type: 'boolean'
                    },
                    prerecordingPrepTime: {
                        type: 'integer'
                    },
                    dailyFolders: {
                        type: 'boolean'
                    },
                    displayVoltageRange: {
                        type: 'boolean'
                    },
                    minimumAmplitudeThresholdDuration: {
                        type: 'integer'
                    },
                    amplitudeThresholdScale: {
                        type: 'string'
                    },
                    version: {
                        type: 'string'
                    },
                    energySaverModeEnabled: {
                        type: 'boolean'
                    },
                    disable48DCFilter: {
                        type: 'boolean'
                    },
                    lowGainRangeEnabled: {
                        type: 'boolean'
                    },
                    timeSettingFromGPSEnabled: {
                        type: 'boolean'
                    },
                    gpsFixTime: {
                        type: 'integer'
                    },
                    ignoreExternalMicrophoneForAcousticChime: {
                        type: 'boolean'
                    },
                    acquireGpsFixBeforeAfter: {
                        type: 'string'
                    },
                    magneticSwitchEnabled: {
                        type: 'boolean'
                    },
                    sunScheduleEnabled: {
                        type: 'boolean'
                    },
                    latitude: {
                        type: 'object',
                        properties: {
                            degrees: {type: 'integer'},
                            hundredths: {type: 'integer'},
                            positiveDirection: {type: 'boolean'}
                        }
                    },
                    longitude: {
                        type: 'object',
                        properties: {
                            degrees: {type: 'integer'},
                            hundredths: {type: 'integer'},
                            positiveDirection: {type: 'boolean'}
                        }
                    },
                    sunMode: {
                        type: 'integer'
                    },
                    sunPeriods: {
                        type: 'object',
                        properties: {
                            sunriseBefore: {type: 'integer'},
                            sunriseAfter: {type: 'integer'},
                            sunsetBefore: {type: 'integer'},
                            sunsetAfter: {type: 'integer'}
                        }
                    },
                    sunRounding: {
                        type: 'integer'
                    },
                    sunDefinition: {
                        type: 'integer'
                    }
                },
                required: []
            };

            try {

                validator.validate(jsonObj, schema, {throwError: true});

            } catch (err) {

                console.error(err);
                throw new Error('JSON validation failed.');

            }

            console.log(jsonObj);

            /* Values to use if a setting is missing */

            let replacementValues = DEFAULT_SETTINGS;
            replacementValues.timePeriods = [];

            let isMissingValues = (typeof jsonObj.timePeriods === 'undefined');
            isMissingValues |= (typeof jsonObj.ledEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.batteryLevelCheckEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.gain === 'undefined');
            isMissingValues |= (typeof jsonObj.dutyEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.filenameWithDeviceIDEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.sleepDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.recordDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.passFiltersEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.lowerFilter === 'undefined');
            isMissingValues |= (typeof jsonObj.higherFilter === 'undefined');
            isMissingValues |= (typeof jsonObj.amplitudeThreshold === 'undefined');
            isMissingValues |= (typeof jsonObj.frequencyTriggerEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.frequencyTriggerWindowLength === 'undefined');
            isMissingValues |= (typeof jsonObj.frequencyTriggerCentreFrequency === 'undefined');
            isMissingValues |= (typeof jsonObj.minimumFrequencyTriggerDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.frequencyTriggerThreshold === 'undefined');
            isMissingValues |= (typeof jsonObj.requireAcousticConfig === 'undefined');
            isMissingValues |= (typeof jsonObj.requireLocationInChime === 'undefined');
            isMissingValues |= (typeof jsonObj.useTimeZoneInChime === 'undefined');
            isMissingValues |= (typeof jsonObj.adjustScheduleUsingTimezoneFromAcousticChime === 'undefined');
            isMissingValues |= (typeof jsonObj.prerecordingPrepTime === 'undefined');
            isMissingValues |= (typeof jsonObj.dailyFolders === 'undefined');
            isMissingValues |= (typeof jsonObj.displayVoltageRange === 'undefined');
            isMissingValues |= (typeof jsonObj.minimumAmplitudeThresholdDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.amplitudeThresholdScale === 'undefined');
            isMissingValues |= (typeof jsonObj.energySaverModeEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.disable48DCFilter === 'undefined');
            isMissingValues |= (typeof jsonObj.lowGainRangeEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.timeSettingFromGPSEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.gpsFixTime === 'undefined');
            isMissingValues |= (typeof jsonObj.ignoreExternalMicrophoneForAcousticChime === 'undefined');
            isMissingValues |= (typeof jsonObj.acquireGpsFixBeforeAfter === 'undefined');
            isMissingValues |= (typeof jsonObj.magneticSwitchEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.sunScheduleEnabled === 'undefined');

            /* Don't open config files created by newer app versions */

            let version = (typeof jsonObj.version === 'undefined') ? '0.0.0' : jsonObj.version;
            const versionArray = version.split('.');
            const major = parseInt(versionArray[0]);
            const minor = parseInt(versionArray[1]);
            const patch = parseInt(versionArray[2]);

            const appVersionArray = app.getVersion().split('.');

            if (constants.isOlderSemanticVersion(appVersionArray, major, minor, patch)) {

                console.error('Cannot open configuration files created by future app versions');

                dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                    type: 'error',
                    title: 'Incorrect format',
                    message: 'Cannot open the configuration file as it was created by a release of the AudioMoth Configuration App greater than ' + app.getVersion() + '.'
                });

                return;

            }

            if (isMissingValues) {

                const buttonIndex = dialog.showMessageBoxSync({
                    type: 'warning',
                    buttons: ['Keep Current Settings', 'Set to Default'],
                    title: 'Configuration file with missing settings loaded',
                    message: 'This configuration file contains a subset of the full settings. Missing settings can either be set to their default values or keep their current values.',
                    cancelId: -1
                });

                if (buttonIndex === 0) {

                    replacementValues = currentConfig;

                } else if (buttonIndex === -1) {

                    console.log('Cancelled opening configuration file');
                    return;

                }

            }

            let timePeriods;
            let ledEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, filenameWithDeviceIDEnabled;
            let recordDuration, sleepDuration;
            let localTime, customTimeZoneOffset, firstRecordingDateEnabled, firstRecordingDate, lastRecordingDateEnabled, lastRecordingDate;
            let passFiltersEnabled, filterType, lowerFilter, higherFilter;
            let amplitudeThresholdingEnabled, amplitudeThreshold;
            let frequencyTriggerEnabled, frequencyTriggerWindowLength, frequencyTriggerCentreFrequency, minimumFrequencyTriggerDuration, frequencyTriggerThreshold;
            let requireAcousticConfig, requireLocationInChime, useTimeZoneInChime, adjustScheduleUsingTimezoneFromAcousticChime, prerecordingPrepTime;
            let dailyFolders, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter, lowGainRangeEnabled;
            let timeSettingFromGPSEnabled, gpsFixTime, ignoreExternalMicrophoneForAcousticChime, acquireGpsFixBeforeAfter;
            let magneticSwitchEnabled, sunScheduleEnabled;
            let latitude, longitude, sunMode, sunPeriods, sunRounding, sunDefinition;

            try {

                timePeriods = (typeof jsonObj.timePeriods === 'undefined') ? replacementValues.timePeriods : jsonObj.timePeriods;

                /* If startTime or endTime === 1440, read it as 0 */

                for (let i = 0; i < timePeriods.length; i++) {

                    timePeriods[i].startMins = timePeriods[i].startMins === constants.MINUTES_IN_DAY ? 0 : timePeriods[i].startMins;
                    timePeriods[i].endMins = timePeriods[i].endMins === constants.MINUTES_IN_DAY ? 0 : timePeriods[i].endMins;

                }

                ledEnabled = (typeof jsonObj.ledEnabled === 'undefined') ? replacementValues.ledEnabled : jsonObj.ledEnabled;

                batteryLevelCheckEnabled = (typeof jsonObj.batteryLevelCheckEnabled === 'undefined') ? replacementValues.batteryLevelCheckEnabled : jsonObj.batteryLevelCheckEnabled;

                sampleRateIndex = getSampleRateIndex(jsonObj.sampleRateIndex, jsonObj.sampleRate, replacementValues.sampleRate);
                const sampleRate = constants.CONFIGURATIONS[sampleRateIndex].trueSampleRate;

                /* If gain is undefined, it's either missing and should be replaced, or using the old gainIndex name */

                gain = (typeof jsonObj.gain === 'undefined') ? jsonObj.gainIndex : jsonObj.gain;
                gain = (typeof gain === 'undefined') ? replacementValues.gain : gain;

                if (!constants.VALID_GAIN_VALUES.includes(gain)) {

                    throw new Error('Gain value can only be 0, 1, 2, 3 or 4.');

                }

                dutyEnabled = (typeof jsonObj.dutyEnabled === 'undefined') ? replacementValues.dutyEnabled : jsonObj.dutyEnabled;

                filenameWithDeviceIDEnabled = (typeof jsonObj.filenameWithDeviceIDEnabled === 'undefined') ? replacementValues.filenameWithDeviceIDEnabled : jsonObj.filenameWithDeviceIDEnabled;

                sleepDuration = (typeof jsonObj.sleepDuration === 'undefined') ? replacementValues.sleepDuration : jsonObj.sleepDuration;

                if (sleepDuration > constants.MAX_SLEEP_DURATION || sleepDuration < 0) {

                    throw new Error('Sleep duration must be between 0 and ' + constants.MAX_SLEEP_DURATION + '.');

                }

                recordDuration = (typeof jsonObj.recordDuration === 'undefined') ? jsonObj.recDuration : jsonObj.recordDuration;
                recordDuration = (typeof recordDuration === 'undefined') ? replacementValues.recordDuration : recordDuration;

                if (recordDuration > constants.MAX_RECORD_DURATION || recordDuration < 0) {

                    throw new Error('Record duration must be between 0 and ' + constants.MAX_RECORD_DURATION + '.');

                }

                /* Try to find time zone mode. If loading an older file try to parse the localTime setting */

                if (typeof jsonObj.customTimeZoneOffset === 'undefined') {

                    localTime = (typeof jsonObj.localTime === 'undefined') ? replacementValues.localTime : jsonObj.localTime;

                } else {

                    localTime = false;

                    customTimeZoneOffset = jsonObj.customTimeZoneOffset;

                    if (customTimeZoneOffset < constants.MIN_CUSTOM_TIME_ZONE_OFFSET || customTimeZoneOffset > constants.MAX_CUSTOM_TIME_ZONE_OFFSET) {

                        throw new Error('Custom time zone offset must be between ' + constants.MIN_CUSTOM_TIME_ZONE_OFFSET + ' and ' + constants.MAX_CUSTOM_TIME_ZONE_OFFSET + '.');

                    }

                    if (customTimeZoneOffset % 15 !== 0) {

                        throw new Error('Custom time zone offset must be divisible by 15.');

                    }

                }

                /* In older versions of the app, whether or not the first/last date is enabled was specified in the save file by just the presence of the date */

                if (typeof jsonObj.firstRecordingDateEnabled === 'undefined') {

                    if (typeof jsonObj.firstRecordingDate === 'undefined') {

                        firstRecordingDateEnabled = false;

                    } else {

                        firstRecordingDateEnabled = true;

                    }

                } else {

                    firstRecordingDateEnabled = jsonObj.firstRecordingDateEnabled;

                }

                // In older versions of the app, whether or not the first/last date is enabled was specified in the save file by just the presence of the date

                if (typeof jsonObj.lastRecordingDateEnabled === 'undefined') {

                    if (typeof jsonObj.lastRecordingDate === 'undefined') {

                        lastRecordingDateEnabled = false;

                    } else {

                        lastRecordingDateEnabled = true;

                    }

                } else {

                    lastRecordingDateEnabled = jsonObj.lastRecordingDateEnabled;

                }

                let replacementFirstRecordingDate;

                if (typeof replacementValues.firstRecordingDate === 'undefined' || replacementValues.firstRecordingDate === '') {

                    replacementFirstRecordingDate = '';

                } else {

                    replacementFirstRecordingDate = replacementValues.firstRecordingDate;

                }

                firstRecordingDate = (typeof jsonObj.firstRecordingDate === 'undefined') ? replacementFirstRecordingDate : jsonObj.firstRecordingDate;

                let replacementLastRecordingDate;

                if (typeof replacementValues.lastRecordingDate === 'undefined' || replacementValues.lastRecordingDate === '') {

                    replacementLastRecordingDate = '';

                } else {

                    replacementLastRecordingDate = replacementValues.lastRecordingDate;

                }

                lastRecordingDate = (typeof jsonObj.lastRecordingDate === 'undefined') ? replacementLastRecordingDate : jsonObj.lastRecordingDate;

                passFiltersEnabled = (typeof jsonObj.passFiltersEnabled === 'undefined') ? replacementValues.passFiltersEnabled : jsonObj.passFiltersEnabled;

                filterType = (typeof jsonObj.filterType === 'undefined') ? replacementValues.filterType : jsonObj.filterType;

                // With older versions of the config app, filter type didn't exist
                filterType = !passFiltersEnabled ? 'none' : filterType;

                lowerFilter = (typeof jsonObj.lowerFilter === 'undefined') ? replacementValues.lowerFilter : jsonObj.lowerFilter;
                higherFilter = (typeof jsonObj.higherFilter === 'undefined') ? replacementValues.higherFilter : jsonObj.higherFilter;

                const sampleRateHz = sampleRate * 1000;

                if (filterType === 'low') {

                    if (higherFilter < 0) {

                        throw new Error('Filter frequency must be greater than 0.');

                    }

                    if (higherFilter > sampleRateHz / 2) {

                        throw new Error('Filter frequency must be less than half current sample rate (' + (sampleRate / 2) + ' kHz).');

                    }

                }

                if (filterType === 'band') {

                    if (lowerFilter < 0) {

                        throw new Error('Filter frequencies must be greater than 0.');

                    }

                    if (lowerFilter > higherFilter) {

                        throw new Error('Lower filter frequency must be less than higher filter frequency for bandpass filter type.');

                    }

                    if (higherFilter > sampleRateHz / 2) {

                        throw new Error('Higher filter frequency must be less than half current sample rate (' + (sampleRate / 2) + ' kHz).');

                    }

                }

                if (filterType === 'high') {

                    if (lowerFilter <= 0) {

                        throw new Error('Filter frequency must be greater than 0.');

                    }

                    if (lowerFilter > sampleRateHz / 2) {

                        throw new Error('Lower filter frequency must be less than half current sample rate (' + (sampleRate / 2) + ' kHz).');

                    }

                }

                if (typeof jsonObj.amplitudeThresholdingEnabled !== 'undefined') {

                    amplitudeThresholdingEnabled = jsonObj.amplitudeThresholdingEnabled;

                } else {

                    amplitudeThresholdingEnabled = replacementValues.amplitudeThresholdingEnabled;

                }

                amplitudeThreshold = (typeof jsonObj.amplitudeThreshold === 'undefined') ? replacementValues.amplitudeThreshold : jsonObj.amplitudeThreshold;

                frequencyTriggerEnabled = (typeof jsonObj.frequencyTriggerEnabled === 'undefined') ? replacementValues.frequencyTriggerEnabled : jsonObj.frequencyTriggerEnabled;
                frequencyTriggerWindowLength = (typeof jsonObj.frequencyTriggerWindowLength === 'undefined') ? replacementValues.frequencyTriggerWindowLength : jsonObj.frequencyTriggerWindowLength;
                frequencyTriggerCentreFrequency = (typeof jsonObj.frequencyTriggerCentreFrequency === 'undefined') ? replacementValues.frequencyTriggerCentreFrequency : jsonObj.frequencyTriggerCentreFrequency;
                minimumFrequencyTriggerDuration = (typeof jsonObj.minimumFrequencyTriggerDuration === 'undefined') ? replacementValues.minimumFrequencyTriggerDuration : jsonObj.minimumFrequencyTriggerDuration;
                frequencyTriggerThreshold = (typeof jsonObj.frequencyTriggerThreshold === 'undefined') ? replacementValues.frequencyTriggerThreshold : jsonObj.frequencyTriggerThreshold;

                requireAcousticConfig = (typeof jsonObj.requireAcousticConfig === 'undefined') ? replacementValues.requireAcousticConfig : jsonObj.requireAcousticConfig;
                requireLocationInChime = (typeof jsonObj.requireLocationInChime === 'undefined') ? replacementValues.requireLocationInChime : jsonObj.requireLocationInChime;
                useTimeZoneInChime = (typeof jsonObj.useTimeZoneInChime === 'undefined') ? replacementValues.useTimeZoneInChime : jsonObj.useTimeZoneInChime;
                adjustScheduleUsingTimezoneFromAcousticChime = (typeof jsonObj.adjustScheduleUsingTimezoneFromAcousticChime === 'undefined') ? replacementValues.adjustScheduleUsingTimezoneFromAcousticChime : jsonObj.adjustScheduleUsingTimezoneFromAcousticChime;

                prerecordingPrepTime = (typeof jsonObj.prerecordingPrepTime === 'undefined') ? replacementValues.prerecordingPrepTime : jsonObj.prerecordingPrepTime;

                dailyFolders = (typeof jsonObj.dailyFolders === 'undefined') ? replacementValues.dailyFolders : jsonObj.dailyFolders;

                displayVoltageRange = (typeof jsonObj.displayVoltageRange === 'undefined') ? replacementValues.displayVoltageRange : jsonObj.displayVoltageRange;

                minimumAmplitudeThresholdDuration = (typeof jsonObj.minimumAmplitudeThresholdDuration === 'undefined') ? replacementValues.minimumAmplitudeThresholdDuration : jsonObj.minimumAmplitudeThresholdDuration;

                const amplitudeThresholdScale = (typeof jsonObj.amplitudeThresholdScale === 'undefined') ? replacementValues.amplitudeThresholdScale : jsonObj.amplitudeThresholdScale;

                /* Previous versions of the app used 0 - 32768 as the amplitude threshold scale. If the scale index isn't in the save file, assume it's from an older app version and match threshold and scale to old range */

                switch (amplitudeThresholdScale) {

                case 'percentage':
                    amplitudeThresholdingScaleIndex = 0;
                    break;
                case '16bit':
                    amplitudeThresholdingScaleIndex = 1;
                    break;
                case 'decibel':
                    amplitudeThresholdingScaleIndex = 2;
                    break;
                default:
                    amplitudeThresholdingScaleIndex = 1;
                    break;

                }

                if (amplitudeThresholdScale === 'percentage' && (amplitudeThreshold > constants.MAX_AMPLITUDE_THRESHOLD_PERCENTAGE || amplitudeThreshold < 0)) {

                    throw new Error('Percentage amplitude threshold must be between 0 and 100.');

                } else if (amplitudeThresholdScale === '16bit' && (amplitudeThreshold > constants.MAX_AMPLITUDE_THRESHOLD_16BIT || amplitudeThreshold < 0)) {

                    throw new Error('16-bit amplitude threshold must be between 0 and 32768.');

                } else if (amplitudeThresholdScale === 'decibel' && (amplitudeThreshold > constants.MAX_AMPLITUDE_THRESHOLD_DECIBEL || amplitudeThreshold < constants.MIN_AMPLITUDE_THRESHOLD_DECIBEL)) {

                    throw new Error('Decibel amplitude threshold must be between -100 and 0.');

                }

                energySaverModeEnabled = (typeof jsonObj.energySaverModeEnabled === 'undefined') ? replacementValues.energySaverModeEnabled : jsonObj.energySaverModeEnabled;

                disable48DCFilter = (typeof jsonObj.disable48DCFilter === 'undefined') ? replacementValues.disable48DCFilter : jsonObj.disable48DCFilter;

                lowGainRangeEnabled = (typeof jsonObj.lowGainRangeEnabled === 'undefined') ? replacementValues.lowGainRangeEnabled : jsonObj.lowGainRangeEnabled;

                timeSettingFromGPSEnabled = (typeof jsonObj.timeSettingFromGPSEnabled === 'undefined') ? replacementValues.timeSettingFromGPSEnabled : jsonObj.timeSettingFromGPSEnabled;

                gpsFixTime = (typeof jsonObj.gpsFixTime === 'undefined') ? replacementValues.gpsFixTime : jsonObj.gpsFixTime;

                if (!constants.VALID_GPS_FIX_TIMES.includes(gpsFixTime)) {

                    throw new Error('GPS fix time must be one of the following values: ' + constants.VALID_GPS_FIX_TIMES.join(', ') + '.');

                }

                ignoreExternalMicrophoneForAcousticChime = (typeof jsonObj.ignoreExternalMicrophoneForAcousticChime === 'undefined') ? replacementValues.ignoreExternalMicrophoneForAcousticChime : jsonObj.ignoreExternalMicrophoneForAcousticChime;

                acquireGpsFixBeforeAfter = (typeof jsonObj.acquireGpsFixBeforeAfter === 'undefined') ? replacementValues.acquireGpsFixBeforeAfter : jsonObj.acquireGpsFixBeforeAfter;

                magneticSwitchEnabled = (typeof jsonObj.magneticSwitchEnabled === 'undefined') ? replacementValues.magneticSwitchEnabled : jsonObj.magneticSwitchEnabled;

                sunScheduleEnabled = (typeof jsonObj.sunScheduleEnabled === 'undefined') ? replacementValues.sunScheduleEnabled : jsonObj.sunScheduleEnabled;

                if (typeof jsonObj.sunScheduleEnabled === 'undefined') {

                    if (timePeriods.length > 0) {

                        sunScheduleEnabled = false;

                    } else {

                        sunScheduleEnabled = replacementValues.sunScheduleEnabled;

                    }

                } else {

                    sunScheduleEnabled = jsonObj.sunScheduleEnabled;

                }

                latitude = (typeof jsonObj.latitude === 'undefined') ? replacementValues.latitude : jsonObj.latitude;
                longitude = (typeof jsonObj.longitude === 'undefined') ? replacementValues.longitude : jsonObj.longitude;

                sunMode = (typeof jsonObj.sunMode === 'undefined') ? replacementValues.sunMode : jsonObj.sunMode;

                sunPeriods = (typeof jsonObj.sunPeriods === 'undefined') ? replacementValues.sunPeriods : jsonObj.sunPeriods;

                sunRounding = (typeof jsonObj.sunRounding === 'undefined') ? replacementValues.sunRounding : jsonObj.sunRounding;

                sunDefinition = (typeof jsonObj.sunDefinition === 'undefined') ? replacementValues.sunDefinition : jsonObj.sunDefinition;

            } catch (error) {

                console.error(error);

                dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                    type: 'error',
                    title: 'Incorrect value',
                    message: 'Cannot load configuration file.\n' + error.message
                });

                return;

            }

            callback(timePeriods,
                ledEnabled, batteryLevelCheckEnabled,
                sampleRateIndex, gain, dutyEnabled, filenameWithDeviceIDEnabled, recordDuration, sleepDuration,
                localTime, customTimeZoneOffset,
                firstRecordingDateEnabled, firstRecordingDate, lastRecordingDateEnabled, lastRecordingDate,
                passFiltersEnabled, filterType, lowerFilter, higherFilter,
                amplitudeThresholdingEnabled, amplitudeThreshold,
                frequencyTriggerEnabled, frequencyTriggerWindowLength, frequencyTriggerCentreFrequency, minimumFrequencyTriggerDuration, frequencyTriggerThreshold,
                requireAcousticConfig, requireLocationInChime, useTimeZoneInChime, adjustScheduleUsingTimezoneFromAcousticChime, prerecordingPrepTime, displayVoltageRange,
                minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex,
                energySaverModeEnabled, disable48DCFilter, lowGainRangeEnabled, timeSettingFromGPSEnabled, acquireGpsFixBeforeAfter, gpsFixTime, ignoreExternalMicrophoneForAcousticChime, magneticSwitchEnabled, dailyFolders,
                sunScheduleEnabled, latitude, longitude, sunMode, sunPeriods, sunRounding, sunDefinition);

            version = version === '0.0.0' ? '< 1.5.0' : version;

            console.log('Loaded configuration file created using version ' + version);

        } catch (usageErr) {

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Incorrect format',
                message: 'An error occurred whilst trying to read the configuration file. The file format is incorrect.'
            });

            console.error(usageErr);

        }

    }

}

/* Display open dialog to allow users to load a .config file */

exports.loadConfiguration = (currentConfig, callback) => {

    const fileName = dialog.showOpenDialogSync({
        title: 'Open configuration',
        nameFieldLabel: 'Configuration name',
        defaultPath: 'AudioMoth.config',
        multiSelections: false,
        filters: [{
            name: 'config',
            extensions: ['config']
        }]
    });

    if (fileName) {

        fs.readFile(fileName[0], (err, data) => {

            useLoadedConfiguration(err, currentConfig, data, callback);

        });

    }

};
