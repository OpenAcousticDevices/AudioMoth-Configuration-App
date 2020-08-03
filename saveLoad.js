/****************************************************************************
 * saveLoad.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

const electron = require('electron');
const dialog = electron.remote.dialog;

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
    filterType: 1,
    lowerFilter: 0,
    higherFilter: 24000,
    amplitudeThresholdingEnabled: false,
    amplitudeThreshold: 0
};
exports.defaultSettings = defaultSettings;

/* Save configuration settings in UI to .config file */

function saveConfiguration (timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, dutyEnabled, passFiltersEnabled, filterTypeIndex, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold, callback) {

    var configuration, fileName, sampleRate, filterType;

    sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;

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

    configuration = '{\n';
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
    configuration += '"amplitudeThreshold": ' + amplitudeThreshold + '\n';
    configuration += '}';

    fileName = dialog.showSaveDialogSync({
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

    var i, closestIndex, distance, minDistance;

    if (typeof jsonSampleRateIndex === 'undefined') {

        jsonSampleRate /= 1000;

        minDistance = -1;
        closestIndex = 0;

        for (i = 0; i < constants.configurations.length; i++) {

            distance = Math.abs(constants.configurations[i].trueSampleRate - jsonSampleRate);

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

    var jsonObj, validator, schema, timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold;

    if (err) {

        dialog.showErrorBox('Load failed', 'Configuration file could not be loaded.');
        console.error(err);

    } else {

        /* Validate JSON */

        try {

            jsonObj = JSON.parse(data);
            validator = new Validator();
            schema = {
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
                        type: 'integer'
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

            timePeriods = [];

            timePeriods = jsonObj.timePeriods;

            ledEnabled = jsonObj.ledEnabled;
            lowVoltageCutoffEnabled = (typeof jsonObj.lowVoltageCutoffEnabled === 'undefined') ? jsonObj.batteryCheckEnabled : jsonObj.lowVoltageCutoffEnabled;
            batteryLevelCheckEnabled = jsonObj.batteryLevelCheckEnabled;

            sampleRateIndex = getSampleRateIndex(jsonObj.sampleRateIndex, jsonObj.sampleRate);

            gain = (typeof jsonObj.gain === 'undefined') ? jsonObj.gainIndex : jsonObj.gain;

            dutyEnabled = (typeof jsonObj.dutyEnabled === 'undefined') ? true : jsonObj.dutyEnabled;

            if (dutyEnabled) {

                sleepDuration = jsonObj.sleepDuration;
                recordDuration = (typeof jsonObj.recordDuration === 'undefined') ? jsonObj.recDuration : jsonObj.recordDuration;

            } else {

                sleepDuration = 0;
                recordDuration = 1;

            }

            localTime = jsonObj.localTime;
            firstRecordingDate = (typeof jsonObj.firstRecordingDate === 'undefined') ? '' : jsonObj.firstRecordingDate;
            lastRecordingDate = (typeof jsonObj.lastRecordingDate === 'undefined') ? '' : jsonObj.lastRecordingDate;

            passFiltersEnabled = (typeof jsonObj.passFiltersEnabled === 'undefined') ? false : jsonObj.passFiltersEnabled;

            if (passFiltersEnabled) {

                switch (jsonObj.filterType) {

                case 'low':
                    filterType = 0;
                    break;
                case 'band':
                    filterType = 1;
                    break;
                case 'high':
                    filterType = 2;
                    break;

                }

            } else {

                filterType = 0;

            }

            lowerFilter = (typeof jsonObj.lowerFilter === 'undefined') ? -1 : jsonObj.lowerFilter;
            higherFilter = (typeof jsonObj.higherFilter === 'undefined') ? -1 : jsonObj.higherFilter;

            amplitudeThresholdingEnabled = (typeof jsonObj.amplitudeThresholdingEnabled === 'undefined') ? false : jsonObj.amplitudeThresholdingEnabled;
            amplitudeThreshold = amplitudeThresholdingEnabled ? jsonObj.amplitudeThreshold : 0;

            callback(timePeriods, ledEnabled, lowVoltageCutoffEnabled, batteryLevelCheckEnabled, sampleRateIndex, gain, dutyEnabled, recordDuration, sleepDuration, localTime, firstRecordingDate, lastRecordingDate, passFiltersEnabled, filterType, lowerFilter, higherFilter, amplitudeThresholdingEnabled, amplitudeThreshold);

            console.log('Config loaded');

        } catch (usageErr) {

            dialog.showErrorBox('Incorrect format', 'Configuration file was not readable.');
            console.error(usageErr);

        }

    }

}

/* Display open dialog to allow users to load a .config file */

exports.loadConfiguration = function (callback) {

    var fileName = dialog.showOpenDialogSync({
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
