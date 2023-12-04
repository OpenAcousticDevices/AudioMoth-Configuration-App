/****************************************************************************
 * uiSettings.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');
const {dialog, BrowserWindow} = require('@electron/remote');

const constants = require('../constants.js');

const uiFiltering = require('./uiFiltering.js');
const uiAdvanced = require('./uiAdvanced.js');
const splitDurationInput = require('./splitDurationInput.js');

/* UI components */

const sampleRadioButtons = document.getElementsByName('sample-rate-radio');
const gainRadioButtons = document.getElementsByName('gain-radio');

const dutyCheckBox = document.getElementById('duty-checkbox');

const sleepDurationInput = splitDurationInput.create('sleep-duration-input', 0, true);
const recordingDurationInput = splitDurationInput.create('recording-duration-input', 1, true);

// Define the next elements which tab navigation would jump to. This allows inputs to know whether or not to start from the final field if shift-tabbed to
const recordingDurationTextInput = splitDurationInput.getTextInput(recordingDurationInput);
splitDurationInput.setNextElements(sleepDurationInput, [recordingDurationTextInput]);
const ledCheckbox = document.getElementById('led-checkbox');
splitDurationInput.setNextElements(recordingDurationInput, [ledCheckbox]);

const recordingDurationLabel = document.getElementById('recording-duration-label');
const sleepDurationLabel = document.getElementById('sleep-duration-label');

/* Whether or not the warning on sleep duration being set less than 5 has been displayed this app load */

let sleepWarningDisplayed = false;

/* Whether or not to display a warning if minimum amplitude threshold is greater than recording length */

let displayDurationWarning = true;

/* Add listeners to all radio buttons which update the life display */

function addRadioButtonListeners (changeFunction) {

    for (let i = 0; i < sampleRadioButtons.length; i++) {

        sampleRadioButtons[i].addEventListener('change', () => {

            const sampleRateIndex = getSelectedRadioValue('sample-rate-radio');
            const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;

            // If a Goertzel value has been changed, don't rescale the values to defaults as sample rate changes
            const passFiltersObserved = uiFiltering.getPassFiltersObserved();
            const centreObserved = uiFiltering.getCentreObserved();
            uiFiltering.sampleRateChange(!passFiltersObserved, !centreObserved, sampleRate);
            changeFunction();

        });

    }

}

/* Enable/disable amplitude thresholding UI based on checkbox */

function updateDutyCycleUI () {

    if (dutyCheckBox.checked) {

        splitDurationInput.setEnabled(recordingDurationInput, true);
        recordingDurationLabel.classList.remove('grey');

        splitDurationInput.setEnabled(sleepDurationInput, true);
        sleepDurationLabel.classList.remove('grey');

    } else {

        splitDurationInput.setEnabled(recordingDurationInput, false);
        recordingDurationLabel.classList.add('grey');

        splitDurationInput.setEnabled(sleepDurationInput, false);
        sleepDurationLabel.classList.add('grey');

    }

}

/* Run check on recording duration and amplitude threshold minimum trigger time */

function checkRecordingDuration () {

    if (dutyCheckBox.checked) {

        const duration = splitDurationInput.getValue(recordingDurationInput);
        checkMinimumTriggerTime(duration);

    }

}

/* Prepare UI */

exports.prepareUI = (changeFunction) => {

    splitDurationInput.addChangeFunction(recordingDurationInput, () => {

        changeFunction();
        checkRecordingDuration();

    });

    splitDurationInput.addChangeFunction(sleepDurationInput, () => {

        changeFunction();

        if (!sleepWarningDisplayed && splitDurationInput.getValue(sleepDurationInput) < 5) {

            sleepWarningDisplayed = true;

            const buttonIndex = dialog.showMessageBoxSync({
                type: 'warning',
                buttons: ['Yes', 'No'],
                title: 'Minimum sleep duration',
                message: 'In some circumstances, your AudioMoth may not be able to open and a close each file in less than 5 seconds. Are you sure you wish to continue?'
            });

            if (buttonIndex !== 0) {

                splitDurationInput.setTotalValue(sleepDurationInput, 5);

            }

        }

    });

    dutyCheckBox.addEventListener('change', () => {

        updateDutyCycleUI();
        changeFunction();

    });

    addRadioButtonListeners(changeFunction);

    updateDutyCycleUI();

    uiFiltering.prepareUI(changeFunction, checkRecordingDuration, () => {

        const sampleRateIndex = getSelectedRadioValue('sample-rate-radio');
        const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;

        // If a Goertzel value has been changed, don't rescale the values to defaults as sample rate changes
        const passFiltersObserved = uiFiltering.getPassFiltersObserved();
        const centreObserved = uiFiltering.getCentreObserved();
        uiFiltering.sampleRateChange(!passFiltersObserved, !centreObserved, sampleRate);

    });

    uiAdvanced.prepareUI(changeFunction);

    splitDurationInput.setTotalValue(sleepDurationInput, 5);
    splitDurationInput.setTotalValue(recordingDurationInput, 55);

};

function getSelectedRadioValue (radioName) {

    return document.querySelector('input[name="' + radioName + '"]:checked').value;

}

exports.getSettings = () => {

    const settings = {
        sampleRateIndex: parseInt(getSelectedRadioValue('sample-rate-radio')),
        gain: parseInt(getSelectedRadioValue('gain-radio')),
        dutyEnabled: dutyCheckBox.checked,
        recordDuration: splitDurationInput.getValue(recordingDurationInput),
        sleepDuration: splitDurationInput.getValue(sleepDurationInput),
        passFiltersEnabled: uiFiltering.filteringIsEnabled(),
        filterType: uiFiltering.getFilterType(),
        lowerFilter: uiFiltering.getLowerSliderValue(),
        higherFilter: uiFiltering.getHigherSliderValue(),
        amplitudeThresholdingEnabled: uiFiltering.amplitudeThresholdIsEnabled(),
        amplitudeThreshold: parseFloat(uiFiltering.getAmplitudeThreshold()),
        frequencyTriggerEnabled: uiFiltering.frequencyTriggerIsEnabled(),
        frequencyTriggerWindowLength: uiFiltering.getFrequencyTriggerWindowLength(),
        frequencyTriggerCentreFrequency: uiFiltering.getFrequencyTriggerFilterFreq(),
        minimumFrequencyTriggerDuration: uiFiltering.getMinimumFrequencyTriggerDuration(),
        frequencyTriggerThreshold: uiFiltering.getFrequencyTrigger(),
        requireAcousticConfig: uiAdvanced.isAcousticConfigRequired(),
        dailyFolders: uiAdvanced.isDailyFolderEnabled(),
        displayVoltageRange: uiAdvanced.displayVoltageRange(),
        minimumAmplitudeThresholdDuration: uiFiltering.getMinimumAmplitudeThresholdDuration(),
        amplitudeThresholdScaleIndex: uiFiltering.getAmplitudeThresholdScaleIndex(),
        energySaverModeEnabled: uiAdvanced.isEnergySaverModeEnabled(),
        lowGainRangeEnabled: uiAdvanced.isLowGainRangeEnabled(),
        disable48DCFilter: uiAdvanced.is48DCFilterDisabled(),
        timeSettingFromGPSEnabled: uiAdvanced.isTimeSettingFromGPSEnabled(),
        magneticSwitchEnabled: uiAdvanced.isMagneticSwitchEnabled()
    };

    return settings;

};

exports.get16BitAmplitudeThreshold = uiFiltering.get16BitAmplitudeThreshold;
exports.getPercentageAmplitudeThreshold = uiFiltering.getPercentageAmplitudeThreshold;
exports.getDecibelAmplitudeThreshold = uiFiltering.getDecibelAmplitudeThreshold;
exports.getPercentageAmplitudeThresholdExponentMantissa = uiFiltering.getPercentageAmplitudeThresholdExponentMantissa;

exports.getFrequencyFilterThresholdExponentMantissa = uiFiltering.getFrequencyFilterThresholdExponentMantissa;

exports.fillUI = (settings) => {

    sampleRadioButtons[settings.sampleRateIndex].checked = true;
    gainRadioButtons[settings.gain].checked = true;

    dutyCheckBox.checked = settings.dutyEnabled;
    updateDutyCycleUI();

    const sampleRateIndex = getSelectedRadioValue('sample-rate-radio');
    const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;

    // If a Goertzel value has been changed, don't rescale the values to defaults as sample rate changes
    const passFiltersObserved = uiFiltering.getPassFiltersObserved();
    const centreObserved = uiFiltering.getCentreObserved();
    uiFiltering.sampleRateChange(!passFiltersObserved, !centreObserved, sampleRate);
    uiFiltering.setFilters(settings.passFiltersEnabled, settings.lowerFilter, settings.higherFilter, settings.filterType);
    uiFiltering.updateFilterUI();

    let filteringType = 0;
    filteringType = settings.amplitudeThresholdingEnabled ? 1 : filteringType;
    filteringType = settings.frequencyTriggerEnabled ? 2 : filteringType;
    uiFiltering.setThresholdType(filteringType);

    uiFiltering.setAmplitudeThresholdScaleIndex(settings.amplitudeThresholdScaleIndex);
    electron.ipcRenderer.send('set-amplitude-threshold-scale', settings.amplitudeThresholdScaleIndex);

    uiFiltering.setAmplitudeThreshold(settings.amplitudeThreshold);

    uiFiltering.setFrequencyTriggerWindowLength(settings.frequencyTriggerWindowLength);
    uiFiltering.setFrequencyTriggerFilterFreq(settings.frequencyTriggerCentreFrequency);

    // Treat all settings as "observed" when loading so sample rate changes affect it
    uiFiltering.setCentreObserved(true);
    uiFiltering.setPassFiltersObserved(true);

    uiFiltering.setMinimumFrequencyTriggerDuration(settings.minimumFrequencyTriggerDuration);
    uiFiltering.setFrequencyTrigger(settings.frequencyTriggerThreshold);

    uiFiltering.updateThresholdUI();

    splitDurationInput.setTotalValue(sleepDurationInput, settings.sleepDuration);
    splitDurationInput.setTotalValue(recordingDurationInput, settings.recordDuration);

    uiAdvanced.fillUI(settings);

    if (settings.timeSettingFromGPSEnabled || settings.magneticSwitchEnabled) {

        uiAdvanced.displayAdditionalHardwareWarning();

    }

    uiFiltering.setMinimumAmplitudeThresholdDuration(settings.minimumAmplitudeThresholdDuration);

};

/* Receive message from the menu about which amplitude threshold scale to use */

electron.ipcRenderer.on('amplitude-threshold-scale', (e, indexSelected) => {

    uiFiltering.setAmplitudeThresholdScaleIndex(indexSelected);

});

/* Check whether recording time is less than minimum amplitude threshold duration and display warning if needed */

function checkMinimumTriggerTime (recordingLength) {

    const thresholdTypeIndex = uiFiltering.getThresholdTypeIndex();

    if (thresholdTypeIndex === uiFiltering.THRESHOLD_TYPE_NONE || !displayDurationWarning) {

        return;

    }

    let triggerDuration = uiFiltering.getMinimumTriggerDurationAmp();

    if (thresholdTypeIndex === uiFiltering.THRESHOLD_TYPE_GOERTZEL) {

        triggerDuration = uiFiltering.getMinimumTriggerDurationGoertzel();

    }

    if (triggerDuration > recordingLength) {

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'warning',
            checkboxLabel: 'Don\'t warn me again',
            title: 'Warning',
            message: 'Note that the minimum threshold duration is currently longer than the scheduled recording duration.'
        }).then(response => {

            displayDurationWarning = !response.checkboxChecked;

        });

    }

};
