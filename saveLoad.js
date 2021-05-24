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

const defaultSettings = {
    sampleRate: 48000,
    gain: 2,
    dutyEnabled: true,
    recordDuration: 55,
    sleepDuration: 5,
    passFiltersEnabled: false,
    filterTypeIndex: 1,
    lowerFilter: 0,
    higherFilter: 24000,
    amplitudeThresholdingEnabled: false,
    amplitudeThreshold: 0,
    requireAcousticConfig: false,
    displayVoltageRange: false,
    minimumAmplitudeThresholdDuration: 0,
    amplitudeThresholdingScaleIndex: 0,
    energySaverModeEnabled: false,
    disable48DCFilter: false
};
exports.defaultSettings = defaultSettings;

/* Save configuration settings in UI to .config file */

function saveConfiguration (timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, dutyEnabled, passFiltersEnabled, filterTypeIndex, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter, callback) {

    const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;

    let filterType;

    switch (filterTypeIndex) {

    case 0:
        filterType = 'low';
        break;
    case 1:
        filterType = 'band';
        break;
    case 2:
        filterType = 'high';
        break;

    }

    let amplitudeThresholdingScale;

    switch (amplitudeThresholdingScaleIndex) {

    case 0:
        amplitudeThresholdingScale = 'percentage';
        break;
    case 1:
        amplitudeThresholdingScale = '16bit';
        break;
    case 2:
        amplitudeThresholdingScale = 'decibel';
        break;

    }

    const versionString = electron.remote.app.getVersion();

    let configuration = '{\n';
    configuration += '"timePeriods": ' + JSON.stringify(timePeriods) + ',\n';
    configuration += '"ledEnabled": ' + ledEnabled + ',\n';
    configuration += '"lowVoltageCutoffEnabled": ' + lowVoltageCutoffEnabled + ',\n';
    configuration += '"batteryLevelCheckEnabled": ' + batteryLevelCheckEnabled + ',\n';
    configuration += '"sampleRate": ' + sampleRate + ',\n';
    configuration += '"gain": ' + gain + ',\n';
    configuration += '"recordDuration": ' + recordDuration + ',\n';
    configuration += '"sleepDuration": ' + sleepDuration + ',\n';
    configuration += '"localTime": ' + localTime + ',\n';

    configuration += (firstRecordingDate !== '') ? '"firstRecordingDate": \"' + firstRecordingDate + '\",\n' : '';
    configuration += (lastRecordingDate !== '') ? '"lastRecordingDate": \"' + lastRecordingDate + '\",\n' : '';

    configuration += '"dutyEnabled": ' + dutyEnabled + ',\n';
    configuration += '"passFiltersEnabled": ' + passFiltersEnabled + ',\n';
    configuration += '"filterType": \"' + filterType + '\",\n';
    configuration += '"lowerFilter": ' + lowerFilter + ',\n';
    configuration += '"higherFilter": ' + higherFilter + ',\n';
    configuration += '"amplitudeThresholdingEnabled": ' + amplitudeThresholdingEnabled + ',\n';
    configuration += '"amplitudeThreshold": ' + amplitudeThreshold + ',\n';
    configuration += '"requireAcousticConfig": ' + requireAcousticConfig + ',\n';
    configuration += '"displayVoltageRange": ' + displayVoltageRange + ',\n';
    configuration += '"minimumAmplitudeThresholdDuration": ' + minimumAmplitudeThresholdDuration + ',\n';
    configuration += '"amplitudeThresholdingScale": \"' + amplitudeThresholdingScale + '\",\n';
    configuration += '"version": \"' + versionString + '\",\n';
    configuration += '"energySaverModeEnabled": ' + energySaverModeEnabled + ',\n';
    configuration += '"disable48DCFilter": ' + disable48DCFilter + '\n';
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

function getSampleRateIndex (jsonSampleRateIndex, jsonSampleRate) {

    if (typeof jsonSampleRateIndex === 'undefined') {

        jsonSampleRate /= 1000;

        let minDistance = -1;
        let closestIndex = 0;

        for (let i = 0; i < constants.configurations.length; i++) {

            const distance = Math.abs(constants.configurations[i].trueSampleRate - jsonSampleRate);

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

function useLoadedConfiguration (err, data, callback) {

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
                    firstRecordingDate: {
                        type: 'string'
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
                    requireAcousticConfig: {
                        type: 'boolean'
                    },
                    displayVoltageRange: {
                        type: 'boolean'
                    },
                    minimumAmplitudeThresholdDuration: {
                        type: 'integer'
                    },
                    amplitudeThresholdingScale: {
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
                    }
                },
                required: ['timePeriods', 'ledEnabled', 'sleepDuration']
            };

            try {

                validator.validate(jsonObj, schema, {throwError: true});

            } catch (err) {

                console.error(err);
                throw new Error('JSON validation failed.');

            }

            console.log(jsonObj);

            const timePeriods = jsonObj.timePeriods;

            const ledEnabled = jsonObj.ledEnabled;
            const lowVoltageCutoffEnabled = (typeof jsonObj.lowVoltageCutoffEnabled === 'undefined') ? jsonObj.batteryCheckEnabled : jsonObj.lowVoltageCutoffEnabled;
            const batteryLevelCheckEnabled = jsonObj.batteryLevelCheckEnabled;

            const sampleRateIndex = getSampleRateIndex(jsonObj.sampleRateIndex, jsonObj.sampleRate);

            const gain = (typeof jsonObj.gain === 'undefined') ? jsonObj.gainIndex : jsonObj.gain;

            const dutyEnabled = (typeof jsonObj.dutyEnabled === 'undefined') ? true : jsonObj.dutyEnabled;

            let sleepDuration, recordDuration;

            if (dutyEnabled) {

                sleepDuration = jsonObj.sleepDuration;
                recordDuration = (typeof jsonObj.recordDuration === 'undefined') ? jsonObj.recDuration : jsonObj.recordDuration;

            } else {

                sleepDuration = 0;
                recordDuration = 1;

            }

            const localTime = jsonObj.localTime;
            const firstRecordingDate = (typeof jsonObj.firstRecordingDate === 'undefined') ? '' : jsonObj.firstRecordingDate;
            const lastRecordingDate = (typeof jsonObj.lastRecordingDate === 'undefined') ? '' : jsonObj.lastRecordingDate;

            const passFiltersEnabled = (typeof jsonObj.passFiltersEnabled === 'undefined') ? false : jsonObj.passFiltersEnabled;

            let filterTypeIndex;

            if (passFiltersEnabled) {

                switch (jsonObj.filterType) {

                case 'low':
                    filterTypeIndex = 0;
                    break;
                case 'band':
                    filterTypeIndex = 1;
                    break;
                case 'high':
                    filterTypeIndex = 2;
                    break;

                }

            } else {

                filterTypeIndex = 0;

            }

            const lowerFilter = (typeof jsonObj.lowerFilter === 'undefined') ? -1 : jsonObj.lowerFilter;
            const higherFilter = (typeof jsonObj.higherFilter === 'undefined') ? -1 : jsonObj.higherFilter;

            const amplitudeThresholdingEnabled = (typeof jsonObj.amplitudeThresholdingEnabled === 'undefined') ? false : jsonObj.amplitudeThresholdingEnabled;
            const amplitudeThreshold = amplitudeThresholdingEnabled ? jsonObj.amplitudeThreshold : 0;

            const requireAcousticConfig = (typeof jsonObj.requireAcousticConfig === 'undefined') ? false : jsonObj.requireAcousticConfig;

            const displayVoltageRange = (typeof jsonObj.displayVoltageRange === 'undefined') ? false : jsonObj.displayVoltageRange;

            const minimumAmplitudeThresholdDuration = (typeof jsonObj.minimumAmplitudeThresholdDuration === 'undefined') ? 0 : jsonObj.minimumAmplitudeThresholdDuration;

            let amplitudeThresholdingScaleIndex;

            /* Previous versions of the app used 0 - 32768 as the amplitude threshold scale. If the scale index isn't in the save file, assume it's from an older app version and match threshold and scale to old range */

            switch (jsonObj.amplitudeThresholdingScale) {

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

            const energySaverModeEnabled = (jsonObj.energySaverModeEnabled === 'undefined') ? false : jsonObj.energySaverModeEnabled;

            const disable48DCFilter = (jsonObj.disable48DCFilter === 'undefined') ? false : jsonObj.disable48DCFilter;

            const version = (typeof jsonObj.version === 'undefined') ? '< 1.5.0' : jsonObj.version;

            callback(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, passFiltersEnabled, filterTypeIndex, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, requireAcousticConfig, displayVoltageRange, minimumAmplitudeThresholdDuration, amplitudeThresholdingScaleIndex, energySaverModeEnabled, disable48DCFilter);

            console.log('Loaded config created by Configuration App version ' + version);

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

exports.loadConfiguration = (callback) => {

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

            useLoadedConfiguration(err, data, callback);

        });

    }

};
