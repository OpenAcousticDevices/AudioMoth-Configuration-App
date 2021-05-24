/****************************************************************************
 * uiSettings.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');
const dialog = electron.remote.dialog;

const uiFiltering = require('./uiFiltering.js');
const uiAdvanced = require('./uiAdvanced.js');
const durationInput = require('./durationInput.js');

/* UI components */

const sampleRadioButtons = document.getElementsByName('sample-rate-radio');
const gainRadioButtons = document.getElementsByName('gain-radio');

const dutyCheckBox = document.getElementById('duty-checkbox');

const recordingDurationInput = document.getElementById('recording-duration-input');
const sleepDurationInput = document.getElementById('sleep-duration-input');

const recordingDurationLabel = document.getElementById('recording-duration-label');
const sleepDurationLabel = document.getElementById('sleep-duration-label');

/* Whether or not the warning on sleep duration being set less than 5 has been displayed this app load */
var sleepWarningDisplayed = false;

/* Add listeners to all radio buttons which update the life display */

function addRadioButtonListeners (changeFunction) {

    for (let i = 0; i < sampleRadioButtons.length; i++) {

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

/* Run check on recording duration and amplitude threshold minimum trigger time */

function checkRecordingDuration () {

    if (dutyCheckBox.checked) {

        const duration = durationInput.getValue(recordingDurationInput);
        uiFiltering.checkMinimumTriggerTime(duration);

    }

}

/* Prepare UI */

exports.prepareUI = (changeFunction) => {

    recordingDurationInput.addEventListener('change', changeFunction);

    recordingDurationInput.addEventListener('focusout', checkRecordingDuration);

    sleepDurationInput.addEventListener('change', changeFunction);

    sleepDurationInput.addEventListener('focusout', () => {

        if (!sleepWarningDisplayed && durationInput.getValue(sleepDurationInput) < 5) {

            sleepWarningDisplayed = true;

            const buttonIndex = dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['Yes', 'No'],
                title: 'Minimum sleep duration',
                message: 'In some circumstances, your AudioMoth may not be able to open and a close each file in less than 5 seconds. Are you sure you wish to continue?'
            });

            if (buttonIndex !== 0) {

                durationInput.setValue(sleepDurationInput, 5);

            }

        }

    });

    dutyCheckBox.addEventListener('change', () => {

        updateDutyCycleUI();
        changeFunction();

    });

    addRadioButtonListeners(changeFunction);

    updateDutyCycleUI();

    uiFiltering.prepareUI(changeFunction, checkRecordingDuration);
    uiAdvanced.prepareUI(changeFunction);

    durationInput.setValue(sleepDurationInput, 5);
    durationInput.setValue(recordingDurationInput, 55);

};

function getSelectedRadioValue (radioName) {

    return document.querySelector('input[name="' + radioName + '"]:checked').value;

}

exports.getSettings = () => {

    const settings = {
        sampleRateIndex: parseInt(getSelectedRadioValue('sample-rate-radio')),
        gain: parseInt(getSelectedRadioValue('gain-radio')),
        dutyEnabled: dutyCheckBox.checked,
        recordDuration: durationInput.getValue(recordingDurationInput),
        sleepDuration: durationInput.getValue(sleepDurationInput),
        passFiltersEnabled: uiFiltering.filteringIsEnabled(),
        filterTypeIndex: uiFiltering.getFilterType(),
        lowerFilter: uiFiltering.getLowerSliderValue(),
        higherFilter: uiFiltering.getHigherSliderValue(),
        amplitudeThresholdingEnabled: uiFiltering.amplitudeThresholdingIsEnabled(),
        amplitudeThreshold: parseFloat(uiFiltering.getAmplitudeThreshold()),
        requireAcousticConfig: uiAdvanced.isAcousticConfigRequired(),
        displayVoltageRange: uiAdvanced.displayVoltageRange(),
        minimumAmplitudeThresholdDuration: uiFiltering.getMinimumAmplitudeThresholdDuration(),
        amplitudeThresholdingScaleIndex: uiFiltering.getAmplitudeThresholdScaleIndex(),
        energySaverModeEnabled: uiAdvanced.isEnergySaverModeEnabled(),
        disable48DCFilter: uiAdvanced.is48DCFilterDisabled()
    };

    return settings;

};

exports.get16BitAmplitudeThreshold = uiFiltering.get16BitAmplitudeThreshold;
exports.getPercentageAmplitudeThreshold = uiFiltering.getPercentageAmplitudeThreshold;
exports.getDecibelAmplitudeThreshold = uiFiltering.getDecibelAmplitudeThreshold;
exports.getPercentageAmplitudeThresholdExponentMantissa = uiFiltering.getPercentageAmplitudeThresholdExponentMantissa;

exports.fillUI = (settings) => {

    sampleRadioButtons[settings.sampleRateIndex].checked = true;
    gainRadioButtons[settings.gain].checked = true;

    dutyCheckBox.checked = settings.dutyEnabled;
    updateDutyCycleUI();

    uiFiltering.sampleRateChange();
    uiFiltering.setFilters(settings.passFiltersEnabled, settings.lowerFilter, settings.higherFilter, settings.filterType);
    uiFiltering.updateFilterUI();

    uiFiltering.setAmplitudeThresholdScaleIndex(settings.amplitudeThresholdingScaleIndex);
    uiFiltering.setAmplitudeThreshold(settings.amplitudeThresholdingEnabled, settings.amplitudeThreshold);
    uiFiltering.updateAmplitudeThresholdingUI();

    durationInput.setValue(sleepDurationInput, settings.sleepDuration);
    durationInput.setValue(recordingDurationInput, settings.recordDuration);

    uiAdvanced.fillUI(settings);

    uiFiltering.setMinimumAmplitudeThresholdDuration(settings.minimumAmplitudeThresholdDuration);

};
