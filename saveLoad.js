/****************************************************************************
 * saveLoad.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*global document*/

var ui = require('./ui.js');
var timeHandler = require('./timePeriods.js');
var lifeDisplay = require('./lifeDisplay.js');

var electron = require('electron');
var dialog = require('electron').remote.dialog;
var fs = require('fs');
var Validator = require('jsonschema').Validator;

/* UI components */

var ledCheckbox = document.getElementById('led-checkbox');
var batteryCheckbox = document.getElementById('battery-checkbox');

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

/* Save configuration settings in UI to .config file */

function saveConfiguration(timePeriods, ledEnabled, batteryCheckEnabled, sampleRateIndex, gainIndex, recDuration, sleepDuration, callback) {

    var configuration = '{ "timePeriods": ' + JSON.stringify(timePeriods) + ',';
    configuration += '"ledEnabled": ' + ledEnabled + ', ';
    configuration += '"batteryCheckEnabled": ' + batteryCheckEnabled + ', ';
    configuration += '"sampleRateIndex": ' + sampleRateIndex + ', ';
    configuration += '"gainIndex": ' + gainIndex + ', ';
    configuration += '"recDuration": ' + recDuration + ', ';
    configuration += '"sleepDuration": ' + sleepDuration;
    configuration += '}';

    dialog.showSaveDialog({
        title: "Save configuration",
        nameFieldLabel: "Configuration name",
        defaultPath: "AudioMoth.config",
        filters: [{
            name: "config",
            extensions: ["config"]
        }]
    }, function (filename) {
        if (filename) {
            fs.writeFile(filename, configuration, callback);
        }
    });

}

exports.saveConfiguration = saveConfiguration;

/* Take data obtained from a loaded .config file and duplicate settings in the UI */

function useLoadedConfiguration(err, data) {

    var jsonObj, validator, schema, sampleRateRadios, gainRadios;

    if (err) {

        dialog.showErrorBox("Load failed", "Configuration file could not be loaded.");
        console.error(err);

    } else {

        /* Validate JSON */

        try {

            jsonObj = JSON.parse(data);
            validator = new Validator();
            schema = {
                "id": "/configuration",
                "type": "object",
                "properties": {
                    "timePeriods": {
                        "type": "array",
                        "items": {
                            "properties": {
                                "startMins": {
                                    "type": "integer"
                                },
                                "endMins": {
                                    "type": "integer"
                                }
                            },
                            "required": ["startMins", "endMins"],
                        }
                    },
                    "ledEnabled": {
                        "type": "boolean"
                    },
                    "batteryCheckEnabled": {
                        "type": "boolean"
                    },
                    "sampleRateIndex": {
                        "type": "integer"
                    },
                    "gainIndex": {
                        "type": "integer"
                    },
                    "recDuration": {
                        "type": "integer"
                    },
                    "sleepDuration": {
                        "type": "integer"
                    }
                },
                "required": ["timePeriods", "ledEnabled", "batteryCheckEnabled", "sampleRateIndex", "gainIndex", "recDuration", "sleepDuration"]
            };

            if (!validator.validate(jsonObj, schema).valid) {

                throw new Error("JSON validation failed.");

            }

            /* Apply settings to UI */

            timeHandler.setTimePeriods(jsonObj.timePeriods);
            timeHandler.updateTimeList();
            ui.updateCanvas();

            ledCheckbox.checked = jsonObj.ledEnabled;
            batteryCheckbox.checked = jsonObj.batteryCheckEnabled;

            sampleRateRadios = document.getElementsByName("sample-rate-radio");
            sampleRateRadios[jsonObj.sampleRateIndex].checked = true;

            gainRadios = document.getElementsByName("gain-radio");
            gainRadios[jsonObj.gainIndex].checked = true;

            recordingDurationInput.value = jsonObj.recDuration;
            sleepDurationInput.value = jsonObj.sleepDuration;
            ui.checkInputs(lifeDisplay.updateLifeDisplay);

            ui.setTimezoneStatus(false);

            console.log("Config loaded");

        } catch (usageErr) {

            dialog.showErrorBox("Incorrect format", "Configuration file was not readable.");
            console.error(usageErr);

        }

    }

}

/* Obtain configuration from UI and pass to relevant function in response to button press */

function saveConfigurationOnClick() {

    var sampleRateIndex, gainIndex, timePeriods;

    timePeriods = timeHandler.getUtcTimePeriods();

    sampleRateIndex = parseInt(ui.getSelectedRadioValue("sample-rate-radio"), 10);
    gainIndex = parseInt(ui.getSelectedRadioValue("gain-radio"), 10);

    saveConfiguration(timePeriods, ledCheckbox.checked, batteryCheckbox.checked, sampleRateIndex, gainIndex, parseInt(recordingDurationInput.value, 10), parseInt(sleepDurationInput.value, 10), function (err) {
        if (err) {

            console.error(err);

        } else {

            console.log("Config saved");

        }
    });

}

/* Display open dialog to allow users to load a .config file */

function loadConfiguration() {

    dialog.showOpenDialog({
        title: "Open configuration",
        nameFieldLabel: "Configuration name",
        defaultPath: "AudioMoth.config",
        multiSelections: false,
        filters: [{
            name: "config",
            extensions: ["config"]
        }]
    }, function (filename) {
        if (filename) {
            fs.readFile(filename[0], useLoadedConfiguration);
        }
    });

}

/* Add listeners to menu options */

electron.ipcRenderer.on('save', function () {
    ui.checkInputs(saveConfigurationOnClick);
});

electron.ipcRenderer.on('load', loadConfiguration);