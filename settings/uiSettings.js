/****************************************************************************
 * uiSettings.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');
const dialog = electron.remote.dialog;

const uiFiltering = require('./uiFiltering.js');
const durationInput = require('./durationInput.js');

/* UI components */

var sampleRadioButtons = document.getElementsByName('sample-rate-radio');
var gainRadioButtons = document.getElementsByName('gain-radio');

var dutyCheckBox = document.getElementById('duty-checkbox');

var recordingDurationInput = document.getElementById('recording-duration-input');
var sleepDurationInput = document.getElementById('sleep-duration-input');

var recordingDurationLabel = document.getElementById('recording-duration-label');
var sleepDurationLabel = document.getElementById('sleep-duration-label');

var acousticConfigCheckBox = document.getElementById('acoustic-config-checkbox');

var voltageRangeCheckBox = document.getElementById('voltage-range-checkbox');

/* Whether or not the warning on sleep duration being set less than 5 has been displayed this app load */
var sleepWarningDisplayed = false;

/* Add listeners to all radio buttons which update the life display */

function addRadioButtonListeners (changeFunction) {

    var i;

    for (i = 0; i < sampleRadioButtons.length; i++) {

        sampleRadioButtons[i].addEventListener('change', function () {

            uiFiltering.sampleRateChange();
            changeFunction();

        });

    }

}

/* Enable/diable amplitude thresholding UI based on checkbox */

function updateDutyCycleUI () {

    if (dutyCheckBox.checked) {

        durationInput.setEnabled(recordingDurationInput, true);
        recordingDurationLabel.style.color = '';

        durationInput.setEnabled(sleepDurationInput, true);
        sleepDurationLabel.style.color = '';

    } else {

        durationInput.setEnabled(recordingDurationInput, false);
        recordingDurationLabel.style.color = 'lightgrey';

        durationInput.setEnabled(sleepDurationInput, false);
        sleepDurationLabel.style.color = 'lightgrey';

    }

}

/* Prepare UI */

exports.prepareUI = function (changeFunction) {

    recordingDurationInput.addEventListener('change', changeFunction);

    sleepDurationInput.addEventListener('change', changeFunction);

    sleepDurationInput.addEventListener('focusout', function () {

        var buttonIndex;

        if (!sleepWarningDisplayed && durationInput.getValue(sleepDurationInput) < 5) {

            sleepWarningDisplayed = true;

            buttonIndex = dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['Yes', 'No'],
                title: 'Are you sure?',
                message: 'In some circumstances, your AudioMoth may not be able to open and a close each file in less than 5 seconds. Are you sure you wish to continue?'
            });

            if (buttonIndex !== 0) {

                durationInput.setValue(sleepDurationInput, 5);

            }

        }

    });

    dutyCheckBox.addEventListener('change', function () {

        updateDutyCycleUI();
        changeFunction();

    });

    addRadioButtonListeners(changeFunction);

    updateDutyCycleUI();

    uiFiltering.prepareUI(changeFunction);

    durationInput.setValue(sleepDurationInput, 5);
    durationInput.setValue(recordingDurationInput, 55);

};

function getSelectedRadioValue (radioName) {

    return document.querySelector('input[name="' + radioName + '"]:checked').value;

}

exports.getSettings = function () {

    var settings = {
        sampleRateIndex: parseInt(getSelectedRadioValue('sample-rate-radio')),
        gain: parseInt(getSelectedRadioValue('gain-radio')),
        dutyEnabled: dutyCheckBox.checked,
        recordDuration: durationInput.getValue(recordingDurationInput),
        sleepDuration: durationInput.getValue(sleepDurationInput),
        passFiltersEnabled: uiFiltering.filteringIsEnabled(),
        filterType: uiFiltering.getFilterType(),
        lowerFilter: uiFiltering.getLowerSliderValue(),
        higherFilter: uiFiltering.getHigherSliderValue(),
        amplitudeThresholdingEnabled: uiFiltering.amplitudeThresholdingIsEnabled(),
        amplitudeThreshold: parseInt(uiFiltering.getAmplitudeThreshold()),
        requireAcousticConfig: acousticConfigCheckBox.checked,
        displayVoltageRange: voltageRangeCheckBox.checked
    };

    return settings;

};

exports.fillUI = function (settings) {

    sampleRadioButtons[settings.sampleRateIndex].checked = true;
    gainRadioButtons[settings.gain].checked = true;

    dutyCheckBox.checked = settings.dutyEnabled;
    updateDutyCycleUI();

    if (settings.dutyEnabled) {

        recordingDurationInput.value = settings.recordDuration;
        sleepDurationInput.value = settings.sleepDuration;

    } else {

        recordingDurationInput.value = 86400;
        sleepDurationInput.value = 0;

    }

    uiFiltering.sampleRateChange();
    uiFiltering.setFilters(settings.passFiltersEnabled, settings.lowerFilter, settings.higherFilter, settings.filterType);
    uiFiltering.updateFilterUI();

    uiFiltering.setAmplitudeThreshold(settings.amplitudeThresholdingEnabled, settings.amplitudeThreshold);
    uiFiltering.updateAmplitudeThresholdingUI();

    durationInput.setValue(sleepDurationInput, settings.sleepDuration);
    durationInput.setValue(recordingDurationInput, settings.recordDuration);

    acousticConfigCheckBox.checked = settings.requireAcousticConfig;
    voltageRangeCheckBox.checked = settings.displayVoltageRange;

};
