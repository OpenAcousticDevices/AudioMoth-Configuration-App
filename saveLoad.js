/****************************************************************************
 * saveLoad.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

const electron = require('electron');
const dialog = electron.remote.dialog;
const BrowserWindow = electron.remote.BrowserWindow;

const fs = require('fs');
const Validator = require('jsonschema').Validator;

const constants = require('./constants.js');

const DEFAULT_SETTINGS = {
    timePeriods: [],
    ledEnabled: true,
    lowVoltageCutoffEnabled: true,
    batteryLevelCheckEnabled: true,
    sampleRate: 48000,
    gain: 2,
    recordDuration: 55,
    sleepDuration: 5,
    localTime: false,
    firstRecordingDateEnabled: false,
    lastRecordingDateEnabled: false,
    dutyEnabled: true,
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
    dailyFolders: false,
    displayVoltageRange: false,
    minimumAmplitudeThresholdDuration: 0,
    amplitudeThresholdScale: 'percentage',
    energySaverModeEnabled: false,
    lowGainRangeEnabled: false,
    disable48DCFilter: false,
    timeSettingFromGPSEnabled: false,
    magneticSwitchEnabled: false
};

/* Save configuration settings in UI to .config file */

function saveConfiguration (currentConfig, callback) {

    const sampleRate = constants.configurations[currentConfig.sampleRateIndex].trueSampleRate * 1000;

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

    const versionString = electron.remote.app.getVersion();

    let configuration = '{\n';
    configuration += '"timePeriods": ' + JSON.stringify(currentConfig.timePeriods) + ',\n';
    configuration += '"ledEnabled": ' + currentConfig.ledEnabled + ',\n';
    configuration += '"lowVoltageCutoffEnabled": ' + currentConfig.lowVoltageCutoffEnabled + ',\n';
    configuration += '"batteryLevelCheckEnabled": ' + currentConfig.batteryLevelCheckEnabled + ',\n';
    configuration += '"sampleRate": ' + sampleRate + ',\n';
    configuration += '"gain": ' + currentConfig.gain + ',\n';
    configuration += '"recordDuration": ' + currentConfig.recordDuration + ',\n';
    configuration += '"sleepDuration": ' + currentConfig.sleepDuration + ',\n';
    configuration += '"localTime": ' + currentConfig.localTime + ',\n';

    configuration += '"firstRecordingDateEnabled": ' + currentConfig.firstRecordingDateEnabled + ',\n';
    configuration += '"lastRecordingDateEnabled": ' + currentConfig.lastRecordingDateEnabled + ',\n';

    configuration += currentConfig.firstRecordingDateEnabled ? '"firstRecordingDate": \"' + currentConfig.firstRecordingDate + '\",\n' : '';
    configuration += currentConfig.lastRecordingDateEnabled ? '"lastRecordingDate": \"' + currentConfig.lastRecordingDate + '\",\n' : '';

    configuration += '"dutyEnabled": ' + currentConfig.dutyEnabled + ',\n';
    configuration += '"passFiltersEnabled": ' + currentConfig.passFiltersEnabled + ',\n';

    configuration += '"filterType": \"' + filterType + '\",\n';

    configuration += '"lowerFilter": ' + currentConfig.lowerFilter + ',\n';
    configuration += '"higherFilter": ' + currentConfig.higherFilter + ',\n';
    configuration += '"amplitudeThresholdingEnabled": ' + currentConfig.amplitudeThresholdingEnabled + ',\n';
    configuration += '"amplitudeThreshold": ' + currentConfig.amplitudeThreshold + ',\n';
    configuration += '"minimumAmplitudeThresholdDuration": ' + currentConfig.minimumAmplitudeThresholdDuration + ',\n';
    configuration += '"frequencyTriggerEnabled": ' + currentConfig.frequencyTriggerEnabled + ',\n';
    configuration += '"frequencyTriggerWindowLength": ' + currentConfig.frequencyTriggerWindowLength + ',\n';
    configuration += '"frequencyTriggerCentreFrequency": ' + currentConfig.frequencyTriggerCentreFrequency + ',\n';
    configuration += '"minimumFrequencyTriggerDuration": ' + currentConfig.minimumFrequencyTriggerDuration + ',\n';
    configuration += '"frequencyTriggerThreshold": ' + currentConfig.frequencyTriggerThreshold + ',\n';
    configuration += '"requireAcousticConfig": ' + currentConfig.requireAcousticConfig + ',\n';
    configuration += '"dailyFolders": ' + currentConfig.dailyFolders + ',\n';
    configuration += '"displayVoltageRange": ' + currentConfig.displayVoltageRange + ',\n';
    configuration += '"amplitudeThresholdScale": \"' + amplitudeThresholdScale + '\",\n';
    configuration += '"version": \"' + versionString + '\",\n';
    configuration += '"energySaverModeEnabled": ' + currentConfig.energySaverModeEnabled + ',\n';
    configuration += '"disable48DCFilter": ' + currentConfig.disable48DCFilter + ',\n';
    configuration += '"lowGainRangeEnabled": ' + currentConfig.lowGainRangeEnabled + ',\n';
    configuration += '"timeSettingFromGPSEnabled": ' + currentConfig.timeSettingFromGPSEnabled + ',\n';
    configuration += '"magneticSwitchEnabled": ' + currentConfig.magneticSwitchEnabled + '\n';
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

        for (let i = 0; i < constants.configurations.length; i++) {

            const distance = Math.abs(constants.configurations[i].trueSampleRate - sampleRate);

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
                    lowVoltageCutoffEnabled: {
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
                    magneticSwitchEnabled: {
                        type: 'boolean'
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
            isMissingValues |= (typeof jsonObj.lowVoltageCutoffEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.batteryLevelCheckEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.gain === 'undefined');
            isMissingValues |= (typeof jsonObj.dutyEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.sleepDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.recordDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.localTime === 'undefined');
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
            isMissingValues |= (typeof jsonObj.dailyFolders === 'undefined');
            isMissingValues |= (typeof jsonObj.displayVoltageRange === 'undefined');
            isMissingValues |= (typeof jsonObj.minimumAmplitudeThresholdDuration === 'undefined');
            isMissingValues |= (typeof jsonObj.amplitudeThresholdScale === 'undefined');
            isMissingValues |= (typeof jsonObj.energySaverModeEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.disable48DCFilter === 'undefined');
            isMissingValues |= (typeof jsonObj.lowGainRangeEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.timeSettingFromGPSEnabled === 'undefined');
            isMissingValues |= (typeof jsonObj.magneticSwitchEnabled === 'undefined');

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

            const timePeriods = (typeof jsonObj.timePeriods === 'undefined') ? replacementValues.timePeriods : jsonObj.timePeriods;

            const ledEnabled = (typeof jsonObj.ledEnabled === 'undefined') ? replacementValues.ledEnabled : jsonObj.ledEnabled;

            let lowVoltageCutoffEnabled = (typeof jsonObj.lowVoltageCutoffEnabled === 'undefined') ? jsonObj.batteryCheckEnabled : jsonObj.lowVoltageCutoffEnabled;
            lowVoltageCutoffEnabled = (typeof lowVoltageCutoffEnabled === 'undefined') ? replacementValues.lowVoltageCutoffEnabled : lowVoltageCutoffEnabled;

            const batteryLevelCheckEnabled = (typeof jsonObj.batteryLevelCheckEnabled === 'undefined') ? replacementValues.batteryLevelCheckEnabled : jsonObj.batteryLevelCheckEnabled;

            const sampleRateIndex = getSampleRateIndex(jsonObj.sampleRateIndex, jsonObj.sampleRate, replacementValues.sampleRate);

            /* If gain is undefined, it's either missing and should be replaced, or using the old gainIndex name */

            let gain = (typeof jsonObj.gain === 'undefined') ? jsonObj.gainIndex : jsonObj.gain;
            gain = (typeof gain === 'undefined') ? replacementValues.gain : gain;

            const dutyEnabled = (typeof jsonObj.dutyEnabled === 'undefined') ? replacementValues.dutyEnabled : jsonObj.dutyEnabled;

            const sleepDuration = (typeof jsonObj.sleepDuration === 'undefined') ? replacementValues.sleepDuration : jsonObj.sleepDuration;

            let recordDuration = (typeof jsonObj.recordDuration === 'undefined') ? jsonObj.recDuration : jsonObj.recordDuration;
            recordDuration = (typeof recordDuration === 'undefined') ? replacementValues.recordDuration : recordDuration;

            const localTime = (typeof jsonObj.localTime === 'undefined') ? replacementValues.localTime : jsonObj.localTime;

            let firstRecordingDateEnabled;

            // In older versions of the app, whether or not the first/last date is enabled was specified in the save file by just the presence of the date

            if (typeof jsonObj.firstRecordingDateEnabled === 'undefined') {

                if (typeof jsonObj.firstRecordingDate === 'undefined') {

                    firstRecordingDateEnabled = false;

                } else {

                    firstRecordingDateEnabled = true;

                }

            } else {

                firstRecordingDateEnabled = jsonObj.firstRecordingDateEnabled;

            }

            let lastRecordingDateEnabled;

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

            const today = new Date();

            const year = ('000' + today.getUTCFullYear()).slice(-4);
            const month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
            const day = ('0' + today.getUTCDate()).slice(-2);
            const todayString = year + '-' + month + '-' + day;

            let replacementFirstRecordingDate;

            if (typeof replacementValues.firstRecordingDate === 'undefined' || replacementValues.firstRecordingDate === '') {

                if (typeof jsonObj.lastRecordingDate === 'undefined') {

                    replacementFirstRecordingDate = todayString;

                } else {

                    replacementFirstRecordingDate = jsonObj.lastRecordingDate;

                }

            } else {

                replacementFirstRecordingDate = replacementValues.firstRecordingDate;

            }

            const firstRecordingDate = (typeof jsonObj.firstRecordingDate === 'undefined') ? replacementFirstRecordingDate : jsonObj.firstRecordingDate;

            let replacementLastRecordingDate;

            if (typeof replacementValues.lastRecordingDate === 'undefined' || replacementValues.lastRecordingDate === '') {

                if (typeof jsonObj.firstRecordingDate === 'undefined') {

                    replacementLastRecordingDate = todayString;

                } else {

                    replacementLastRecordingDate = jsonObj.firstRecordingDate;

                }

            } else {

                replacementLastRecordingDate = replacementValues.lastRecordingDate;

            }

            const lastRecordingDate = (typeof jsonObj.lastRecordingDate === 'undefined') ? replacementLastRecordingDate : jsonObj.lastRecordingDate;

            const passFiltersEnabled = (typeof jsonObj.passFiltersEnabled === 'undefined') ? replacementValues.passFiltersEnabled : jsonObj.passFiltersEnabled;

            const filterType = (typeof jsonObj.filterType === 'undefined') ? replacementValues.filterType : jsonObj.filterType;

            const lowerFilter = (typeof jsonObj.lowerFilter === 'undefined') ? replacementValues.lowerFilter : jsonObj.lowerFilter;
            const higherFilter = (typeof jsonObj.higherFilter === 'undefined') ? replacementValues.higherFilter : jsonObj.higherFilter;

            let amplitudeThresholdingEnabled;

            if (typeof jsonObj.amplitudeThresholdingEnabled !== 'undefined') {

                amplitudeThresholdingEnabled = jsonObj.amplitudeThresholdingEnabled;

            } else if (typeof jsonObj.amplitudeThresholdingEnabled !== 'undefined') {

                amplitudeThresholdingEnabled = jsonObj.amplitudeThresholdingEnabled;

            } else {

                amplitudeThresholdingEnabled = replacementValues.amplitudeThresholdingEnabled;

            }

            const amplitudeThreshold = (typeof jsonObj.amplitudeThreshold === 'undefined') ? replacementValues.amplitudeThreshold : jsonObj.amplitudeThreshold;

            const frequencyTriggerEnabled = (typeof jsonObj.frequencyTriggerEnabled === 'undefined') ? replacementValues.frequencyTriggerEnabled : jsonObj.frequencyTriggerEnabled;
            const frequencyTriggerWindowLength = (typeof jsonObj.frequencyTriggerWindowLength === 'undefined') ? replacementValues.frequencyTriggerWindowLength : jsonObj.frequencyTriggerWindowLength;
            const frequencyTriggerCentreFrequency = (typeof jsonObj.frequencyTriggerCentreFrequency === 'undefined') ? replacementValues.frequencyTriggerCentreFrequency : jsonObj.frequencyTriggerCentreFrequency;
            const minimumFrequencyTriggerDuration = (typeof jsonObj.minimumFrequencyTriggerDuration === 'undefined') ? replacementValues.minimumFrequencyTriggerDuration : jsonObj.minimumFrequencyTriggerDuration;
            const frequencyTriggerThreshold = (typeof jsonObj.frequencyTriggerThreshold === 'undefined') ? replacementValues.frequencyTriggerThreshold : jsonObj.frequencyTriggerThreshold;

            const requireAcousticConfig = (typeof jsonObj.requireAcousticConfig === 'undefined') ? replacementValues.requireAcousticConfig : jsonObj.requireAcousticConfig;

            const dailyFolders = (typeof jsonObj.dailyFolders === 'undefined') ? replacementValues.dailyFolders : jsonObj.dailyFolders;

            const displayVoltageRange = (typeof jsonObj.displayVoltageRange === 'undefined') ? replacementValues.displayVoltageRange : jsonObj.displayVoltageRange;

            const minimumAmplitudeThresholdDuration = (typeof jsonObj.minimumAmplitudeThresholdDuration === 'undefined') ? replacementValues.minimumAmplitudeThresholdDuration : jsonObj.minimumAmplitudeThresholdDuration;

            const amplitudeThresholdScale = (typeof jsonObj.amplitudeThresholdScale === 'undefined') ? replacementValues.amplitudeThresholdScale : jsonObj.amplitudeThresholdScale;

            let amplitudeThresholdingScaleIndex;

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

            const energySaverModeEnabled = (typeof jsonObj.energySaverModeEnabled === 'undefined') ? replacementValues.energySaverModeEnabled : jsonObj.energySaverModeEnabled;

            const disable48DCFilter = (typeof jsonObj.disable48DCFilter === 'undefined') ? replacementValues.disable48DCFilter : jsonObj.disable48DCFilter;

            const lowGainRangeEnabled = (typeof jsonObj.lowGainRangeEnabled === 'undefined') ? replacementValues.lowGainRangeEnabled : jsonObj.lowGainRangeEnabled;

            const timeSettingFromGPSEnabled = (typeof jsonObj.timeSettingFromGPSEnabled === 'undefined') ? replacementValues.timeSettingFromGPSEnabled : jsonObj.timeSettingFromGPSEnabled;

            const magneticSwitchEnabled = (typeof jsonObj.magneticSwitchEnabled === 'undefined') ? replacementValues.magneticSwitchEnabled : jsonObj.magneticSwitchEnabled;

            const version = (typeof jsonObj.version === 'undefined') ? '< 1.5.0' : jsonObj.version;

            callback(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, firstRecordingDateEnabled, firstRecordingDate, lastRecordingDateEnabled, lastRecordingDate, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, frequencyTriggerEnabled, frequencyTriggerWindowLength, frequencyTriggerCentreFrequency, minimumFrequencyTriggerDuration, frequencyTriggerThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter, lowGainRangeEnabled, timeSettingFromGPSEnabled, magneticSwitchEnabled, dailyFolders);

            console.log('Loaded configuration file');

        } catch (usageErr) {

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                type: 'error',
                title: 'Incorrect format',
                message: 'Configuration file was not readable.'
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

        fs.readFile(fileName[0], function (err, data) {

            useLoadedConfiguration(err, currentConfig, data, callback);

        });

    }

};
