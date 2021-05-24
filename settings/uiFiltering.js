/****************************************************************************
 * uiFiltering.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

const electron = require('electron');
const dialog = electron.remote.dialog;
const BrowserWindow = electron.remote.BrowserWindow;

const constants = require('../constants.js');

const Slider = require('bootstrap-slider');

const FILTER_SLIDER_STEPS = [100, 100, 100, 100, 200, 500, 500, 1000];

const filterTypeLabel = document.getElementById('filter-type-label');
const filterRadioButtons = document.getElementsByName('filter-radio');
const filterRadioLabels = document.getElementsByName('filter-radio-label');

const highPassRow = document.getElementById('high-pass-row');
const lowPassRow = document.getElementById('low-pass-row');
const bandPassRow = document.getElementById('band-pass-row');

const bandPassMaxLabel = document.getElementById('band-pass-filter-max-label');
const bandPassMinLabel = document.getElementById('band-pass-filter-min-label');
const lowPassMaxLabel = document.getElementById('low-pass-filter-max-label');
const lowPassMinLabel = document.getElementById('low-pass-filter-min-label');
const highPassMaxLabel = document.getElementById('high-pass-filter-max-label');
const highPassMinLabel = document.getElementById('high-pass-min-label');

const filterCheckbox = document.getElementById('filter-checkbox');
const highPassFilterSlider = new Slider('#high-pass-filter-slider', {});
const lowPassFilterSlider = new Slider('#low-pass-filter-slider', {});
const bandPassFilterSlider = new Slider('#band-pass-filter-slider', {});

const filterLabel = document.getElementById('filter-label');

const amplitudeThresholdingMaxLabel = document.getElementById('amplitude-thresholding-max-label');
const amplitudeThresholdingMinLabel = document.getElementById('amplitude-thresholding-min-label');

const amplitudeThresholdingCheckbox = document.getElementById('amplitude-thresholding-checkbox');
const amplitudeThresholdingSlider = new Slider('#amplitude-thresholding-slider', {});
const amplitudeThresholdingLabel = document.getElementById('amplitude-thresholding-label');
const amplitudeThresholdingTimeTable = document.getElementById('trigger-time-table');
const amplitudeThresholdingRadioButtons = document.getElementsByName('trigger-time-radio');

const VALID_AMPLITUDE_VALUES = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 88, 96, 104, 112, 120, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 352, 384, 416, 448, 480, 512, 576, 640, 704, 768, 832, 896, 960, 1024, 1152, 1280, 1408, 1536, 1664, 1792, 1920, 2048, 2304, 2560, 2816, 3072, 3328, 3584, 3840, 4096, 4608, 5120, 5632, 6144, 6656, 7168, 7680, 8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384, 18432, 20480, 22528, 24576, 26624, 28672, 30720, 32768];

/* Whether or not to display a warning if minimum amplitude threshold is greater than recording length */

var displayDurationWarning = true;

const FILTER_LOW = 0;
const FILTER_BAND = 1;
const FILTER_HIGH = 2;
exports.FILTER_LOW = FILTER_LOW;
exports.FILTER_BAND = FILTER_BAND;
exports.FILTER_HIGH = FILTER_HIGH;

/* 0: 0-100%, 1: 16-Bit, 2: Decibels */

var amplitudeThresholdingScaleIndex = 0;
const AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE = 0;
const AMPLITUDE_THRESHOLD_SCALE_16BIT = 1;
const AMPLITUDE_THRESHOLD_SCALE_DECIBEL = 2;

var previousSelectionType = 1;

var updateLifeDisplayOnChange;

/* All possible slider values */

const THRESHOLD_PERCENTAGE_SLIDER_VALUES = [];
const THRESHOLD_16BIT_SLIDER_VALUES = [];
const THRESHOLD_DECIBEL_SLIDER_VALUES = [];

/* Fill possible slider value lists */

const sliderMin = amplitudeThresholdingSlider.getAttribute('min');
const sliderMax = amplitudeThresholdingSlider.getAttribute('max');
const sliderStep = amplitudeThresholdingSlider.getAttribute('step');

for (let sIndex = sliderMin; sIndex <= sliderMax; sIndex += sliderStep) {

    const rawSlider = (sIndex / sliderMax);

    const amplitudeThresholdValues = convertAmplitudeThreshold(rawSlider);

    THRESHOLD_PERCENTAGE_SLIDER_VALUES.push(parseFloat(amplitudeThresholdValues.percentage));
    THRESHOLD_16BIT_SLIDER_VALUES.push(amplitudeThresholdValues.amplitude);
    THRESHOLD_DECIBEL_SLIDER_VALUES.push(amplitudeThresholdValues.decibels);

}

/* Add last() to Array */

if (!Array.prototype.last) {

    Array.prototype.last = () => {

        return this[this.length - 1];

    };

};

/* Retrieve the radio button selected from a group of named buttons */

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value, 10);

}

function updateFilterSliders () {

    const newSelectionType = getSelectedRadioValue('filter-radio');

    if (previousSelectionType === FILTER_LOW) {

        if (newSelectionType === FILTER_BAND) {

            bandPassFilterSlider.setValue([0, lowPassFilterSlider.getValue()]);

        } else if (newSelectionType === FILTER_HIGH) {

            highPassFilterSlider.setValue(lowPassFilterSlider.getValue());

        }

    } else if (previousSelectionType === FILTER_HIGH) {

        if (newSelectionType === FILTER_BAND) {

            bandPassFilterSlider.setValue([highPassFilterSlider.getValue(), bandPassFilterSlider.getAttribute('max')]);

        } else if (newSelectionType === FILTER_LOW) {

            lowPassFilterSlider.setValue(highPassFilterSlider.getValue());

        }

    } else if (previousSelectionType === FILTER_BAND) {

        if (newSelectionType === FILTER_LOW) {

            lowPassFilterSlider.setValue(Math.max(...bandPassFilterSlider.getValue()));

        } else if (newSelectionType === FILTER_HIGH) {

            highPassFilterSlider.setValue(Math.min(...bandPassFilterSlider.getValue()));

        }

    }

    previousSelectionType = newSelectionType;

}

/* Update the text on the label which describes the range of frequencies covered by the filter */

function updateFilterLabel () {

    let currentBandPassLower, currentBandPassHigher, currentHighPass, currentLowPass;

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        currentHighPass = highPassFilterSlider.getValue() / 1000;
        filterLabel.textContent = 'Recordings will be filtered to frequencies above ' + currentHighPass.toFixed(1) + ' kHz.';
        break;
    case FILTER_LOW:
        currentLowPass = lowPassFilterSlider.getValue() / 1000;
        filterLabel.textContent = 'Recordings will be filtered to frequencies below ' + currentLowPass.toFixed(1) + ' kHz.';
        break;
    case FILTER_BAND:
        currentBandPassLower = Math.min(...bandPassFilterSlider.getValue()) / 1000;
        currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue()) / 1000;
        filterLabel.textContent = 'Recordings will be filtered to frequencies between ' + currentBandPassLower.toFixed(1) + ' and ' + currentBandPassHigher.toFixed(1) + ' kHz.';
        break;

    }

}

/* Work out where on the slider a given amplitude threshold value is */

function lookupAmplitudeThresholdingSliderValue (amplitudeThreshold, scaleIndex) {

    let searchList;

    switch (scaleIndex) {

    case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:
        searchList = THRESHOLD_PERCENTAGE_SLIDER_VALUES;
        break;

    case AMPLITUDE_THRESHOLD_SCALE_16BIT:
        searchList = THRESHOLD_16BIT_SLIDER_VALUES;
        break;

    case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:
        searchList = THRESHOLD_DECIBEL_SLIDER_VALUES;
        break;

    }

    for (let i = 0; i < searchList.length; i++) {

        if (searchList[i] === amplitudeThreshold) {

            return i;

        }

    }

}

/* Convert exponent and mantissa into a string */

function formatPercentage (mantissa, exponent) {

    let response = '';

    if (exponent < 0) {

        response += '0.0000'.substring(0, 1 - exponent);

    }

    response += mantissa;

    for (let i = 0; i < exponent; i += 1) response += '0';

    return response;

}

/* Calculate the amplitude threshold in the currently enabled scale */

function convertAmplitudeThreshold (rawSlider) {

    let exponent, mantissa, validAmplitude;

    const rawLog = (100 * rawSlider - 100);

    /* Decibels */

    const decibelValue = 2 * Math.round(rawLog / 2);

    /* Percentage */

    exponent = 2 + Math.floor(rawLog / 20.0);
    mantissa = Math.round(Math.pow(10, rawLog / 20.0 - exponent + 2));

    if (mantissa === 10) {

        mantissa = 1;
        exponent += 1;

    }

    const percentageString = formatPercentage(mantissa, exponent);

    /* 16-bit */

    const rawAmplitude = Math.round(32768 * Math.pow(10, rawLog / 20));

    for (let i = 0; i < VALID_AMPLITUDE_VALUES.length; i++) {

        if (rawAmplitude <= VALID_AMPLITUDE_VALUES[i]) {

            validAmplitude = VALID_AMPLITUDE_VALUES[i];
            break;

        }

    }

    return {
        decibels: decibelValue,
        percentageExponent: exponent,
        percentageMantissa: mantissa,
        percentage: percentageString,
        amplitude: validAmplitude
    };

}

/* Update the amplitude threshold limit labels to match the chosen scale */

function updateAmplitudeThresholdingLabel () {

    const amplitudeThreshold = convertAmplitudeThreshold(amplitudeThresholdingSlider.getValue() / amplitudeThresholdingSlider.getAttribute('max'));

    amplitudeThresholdingLabel.textContent = 'Amplitude threshold of ';

    switch (amplitudeThresholdingScaleIndex) {

    case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:

        amplitudeThresholdingLabel.textContent += amplitudeThreshold.percentage + '%';
        break;

    case AMPLITUDE_THRESHOLD_SCALE_16BIT:

        amplitudeThresholdingLabel.textContent += amplitudeThreshold.amplitude;
        break;

    case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:

        amplitudeThresholdingLabel.textContent += amplitudeThreshold.decibels + ' dB';
        break;

    }

    amplitudeThresholdingLabel.textContent += ' will be used when generating T.WAV files.';

}

/* Set the high-pass filter values to given value */

function setHighPassSliderValue (value) {

    highPassFilterSlider.setValue(value);

}

/* Set the low-pass filter values to given value */

function setLowPassSliderValue (value) {

    lowPassFilterSlider.setValue(value);

}

/* Set the band-pass filter values to 2 given values */

function setBandPass (lowerSliderValue, higherSliderValue) {

    lowerSliderValue = (lowerSliderValue === -1) ? 0 : lowerSliderValue;
    higherSliderValue = (higherSliderValue === -1) ? bandPassFilterSlider.getAttribute('max') : higherSliderValue;

    bandPassFilterSlider.setValue([lowerSliderValue, higherSliderValue]);

}

/* Exported functions for setting values */

exports.setFilters = (enabled, lowerSliderValue, higherSliderValue, filterType) => {

    filterCheckbox.checked = enabled;

    if (enabled) {

        switch (filterType) {

        case FILTER_LOW:
            setLowPassSliderValue(higherSliderValue);
            break;

        case FILTER_HIGH:
            setHighPassSliderValue(lowerSliderValue);
            break;

        case FILTER_BAND:
            setBandPass(lowerSliderValue, higherSliderValue);
            break;

        }

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].checked = (i === filterType);

        }

        updateFilterLabel();

    }

};

exports.setAmplitudeThresholdScaleIndex = (scaleIndex) => {

    electron.ipcRenderer.send('set-amplitude-threshold-scale', scaleIndex);

    amplitudeThresholdingScaleIndex = scaleIndex;
    updateAmplitudeThresholdingScale();

};

exports.setAmplitudeThreshold = (enabled, amplitudeThreshold) => {

    amplitudeThresholdingCheckbox.checked = enabled;

    amplitudeThresholdingSlider.setValue(lookupAmplitudeThresholdingSliderValue(amplitudeThreshold, amplitudeThresholdingScaleIndex));

};

function setMinimumAmplitudeThresholdDuration (index) {

    amplitudeThresholdingRadioButtons[index].checked = true;

}

exports.setMinimumAmplitudeThresholdDuration = setMinimumAmplitudeThresholdDuration;

/* External functions for obtaining values */

exports.filteringIsEnabled = () => {

    return filterCheckbox.checked;

};

exports.getFilterType = () => {

    return getSelectedRadioValue('filter-radio');

};

exports.getLowerSliderValue = () => {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return highPassFilterSlider.getValue();
    case FILTER_LOW:
        return 0;
    case FILTER_BAND:
        return Math.min(...bandPassFilterSlider.getValue());

    }

};

exports.getHigherSliderValue = () => {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return 65535;
    case FILTER_LOW:
        return lowPassFilterSlider.getValue();
    case FILTER_BAND:
        return Math.max(...bandPassFilterSlider.getValue());

    }

};

function get16BitAmplitudeThreshold () {

    return convertAmplitudeThreshold(amplitudeThresholdingSlider.getValue() / amplitudeThresholdingSlider.getAttribute('max')).amplitude;

}

exports.get16BitAmplitudeThreshold = get16BitAmplitudeThreshold;

function getPercentageAmplitudeThreshold () {

    return convertAmplitudeThreshold(amplitudeThresholdingSlider.getValue() / amplitudeThresholdingSlider.getAttribute('max')).percentage;

}

exports.getPercentageAmplitudeThreshold = getPercentageAmplitudeThreshold;

function getDecibelAmplitudeThreshold () {

    return convertAmplitudeThreshold(amplitudeThresholdingSlider.getValue() / amplitudeThresholdingSlider.getAttribute('max')).decibels;

}

exports.getDecibelAmplitudeThreshold = getDecibelAmplitudeThreshold;

function getPercentageAmplitudeThresholdExponentMantissa () {

    const results = convertAmplitudeThreshold(amplitudeThresholdingSlider.getValue() / amplitudeThresholdingSlider.getAttribute('max'));

    return {
        exponent: results.percentageExponent,
        mantissa: results.percentageMantissa
    };

}

exports.getPercentageAmplitudeThresholdExponentMantissa = getPercentageAmplitudeThresholdExponentMantissa;

exports.getAmplitudeThreshold = () => {

    switch (amplitudeThresholdingScaleIndex) {

    case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:
        return getPercentageAmplitudeThreshold();

    case AMPLITUDE_THRESHOLD_SCALE_16BIT:
        return get16BitAmplitudeThreshold();

    case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:
        return getDecibelAmplitudeThreshold();

    }

};

exports.amplitudeThresholdingIsEnabled = () => {

    return amplitudeThresholdingCheckbox.checked;

};

exports.getAmplitudeThresholdScaleIndex = () => {

    return amplitudeThresholdingScaleIndex;

};

function getMinimumAmplitudeThresholdDuration () {

    return parseInt(getSelectedRadioValue('trigger-time-radio'));

}

exports.getMinimumAmplitudeThresholdDuration = getMinimumAmplitudeThresholdDuration;

/* Enable/disable amplitude threshold UI based on checkbox */

function updateAmplitudeThresholdingUI () {

    if (amplitudeThresholdingCheckbox.checked) {

        amplitudeThresholdingSlider.enable();
        amplitudeThresholdingMaxLabel.style.color = '';
        amplitudeThresholdingMinLabel.style.color = '';

        amplitudeThresholdingLabel.style.color = '';
        updateAmplitudeThresholdingLabel();

        amplitudeThresholdingTimeTable.style.color = '';

        for (let i = 0; i < amplitudeThresholdingRadioButtons.length; i++) {

            amplitudeThresholdingRadioButtons[i].disabled = false;

        }

    } else {

        amplitudeThresholdingSlider.disable();
        amplitudeThresholdingMaxLabel.style.color = 'grey';
        amplitudeThresholdingMinLabel.style.color = 'grey';

        amplitudeThresholdingLabel.style.color = 'grey';
        amplitudeThresholdingLabel.textContent = 'All audio will be written to a .WAV file.';

        amplitudeThresholdingTimeTable.style.color = 'grey';

        for (let i = 0; i < amplitudeThresholdingRadioButtons.length; i++) {

            amplitudeThresholdingRadioButtons[i].disabled = true;

        }

    }

    updateLifeDisplayOnChange();

}

exports.updateAmplitudeThresholdingUI = updateAmplitudeThresholdingUI;

/* Check if the filtering UI should be enabled and update accordingly */

function updateFilterUI () {

    const filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_LOW:
        lowPassRow.style.display = 'flex';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_HIGH:
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'flex';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_BAND:
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'flex';
        break;

    }

    if (filterCheckbox.checked) {

        filterTypeLabel.style.color = '';

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].style.color = '';
            filterRadioButtons[i].disabled = false;
            filterRadioLabels[i].style.color = '';

        }

        bandPassFilterSlider.enable();
        lowPassFilterSlider.enable();
        highPassFilterSlider.enable();
        bandPassMaxLabel.style.color = '';
        bandPassMinLabel.style.color = '';
        lowPassMaxLabel.style.color = '';
        lowPassMinLabel.style.color = '';
        highPassMaxLabel.style.color = '';
        highPassMinLabel.style.color = '';

        filterLabel.style.color = '';

    } else {

        filterTypeLabel.style.color = 'grey';

        for (let i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].style.color = 'grey';
            filterRadioButtons[i].disabled = true;
            filterRadioLabels[i].style.color = 'grey';

        }

        bandPassFilterSlider.disable();
        lowPassFilterSlider.disable();
        highPassFilterSlider.disable();
        bandPassMaxLabel.style.color = 'grey';
        bandPassMinLabel.style.color = 'grey';
        lowPassMaxLabel.style.color = 'grey';
        lowPassMinLabel.style.color = 'grey';
        highPassMaxLabel.style.color = 'grey';
        highPassMinLabel.style.color = 'grey';

        filterLabel.textContent = 'Recordings will not be filtered.';
        filterLabel.style.color = 'grey';

    }

}

exports.updateFilterUI = updateFilterUI;

/* When sample rate changes, so does the slider step. Update values to match the corresponding step */

function roundToSliderStep (value, step) {

    return Math.round(value / step) * step;

}

/* Update UI according to new sample rate selection */

exports.sampleRateChange = () => {

    const sampleRateIndex = getSelectedRadioValue('sample-rate-radio');

    const sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;
    const maxFreq = sampleRate / 2;

    const labelText = (maxFreq / 1000) + 'kHz';

    lowPassMaxLabel.textContent = labelText;
    highPassMaxLabel.textContent = labelText;
    bandPassMaxLabel.textContent = labelText;

    highPassFilterSlider.setAttribute('max', maxFreq);
    lowPassFilterSlider.setAttribute('max', maxFreq);
    bandPassFilterSlider.setAttribute('max', maxFreq);

    highPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);
    lowPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);
    bandPassFilterSlider.setAttribute('step', FILTER_SLIDER_STEPS[sampleRateIndex]);

    /* Validate current band-pass filter values */

    const currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
    const currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());

    const newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;

    const newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;

    setBandPass(roundToSliderStep(Math.max(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRateIndex]), roundToSliderStep(Math.min(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRateIndex]));

    /* Validate current low-pass filter value */

    const currentLowPass = lowPassFilterSlider.getValue();
    const newLowPass = currentLowPass > maxFreq ? maxFreq : currentLowPass;
    setLowPassSliderValue(roundToSliderStep(newLowPass, FILTER_SLIDER_STEPS[sampleRateIndex]));

    /* Validate current high-pass filter value */

    const currentHighPass = highPassFilterSlider.getValue();
    const newHighPass = currentHighPass > maxFreq ? maxFreq : currentHighPass;
    setHighPassSliderValue(roundToSliderStep(newHighPass, FILTER_SLIDER_STEPS[sampleRateIndex]));

    updateFilterLabel();

};

/* Update the labels either side of the amplitude threshold scale */

function updateAmplitudeThresholdingScale () {

    updateAmplitudeThresholdingLabel();

    switch (amplitudeThresholdingScaleIndex) {

    default:
    case AMPLITUDE_THRESHOLD_SCALE_PERCENTAGE:
        amplitudeThresholdingMinLabel.innerHTML = '0.001%';
        amplitudeThresholdingMaxLabel.innerHTML = '100%';
        break;

    case AMPLITUDE_THRESHOLD_SCALE_16BIT:
        amplitudeThresholdingMinLabel.innerHTML = '0';
        amplitudeThresholdingMaxLabel.innerHTML = '32768';
        break;

    case AMPLITUDE_THRESHOLD_SCALE_DECIBEL:
        amplitudeThresholdingMinLabel.innerHTML = '-100 dB';
        amplitudeThresholdingMaxLabel.innerHTML = '0 dB';
        break;

    }

}

/* Receive message from the menu about which amplitude threshold scale to use */

electron.ipcRenderer.on('amplitude-threshold-scale', (e, indexSelected) => {

    amplitudeThresholdingScaleIndex = indexSelected;
    updateAmplitudeThresholdingScale();

});

/* Check whether recording time is less than minimum amplitude threshold duration and display warning if needed */

exports.checkMinimumTriggerTime = (recordingLength) => {

    if (!amplitudeThresholdingCheckbox.checked || !displayDurationWarning) {

        return;

    }

    const minimumLengths = [0, 1, 2, 5, 10, 15, 30, 60];

    if (minimumLengths[getMinimumAmplitudeThresholdDuration()] > recordingLength) {

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

/* Add listeners to all radio buttons which update the filter sliders */

function addRadioButtonListeners () {

    for (let i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].addEventListener('change', function () {

            updateFilterUI();
            updateFilterSliders();
            updateFilterLabel();

        });

    }

}

/* Prepare UI */

exports.prepareUI = (changeFunction, checkRecordingDurationFunction) => {

    updateLifeDisplayOnChange = changeFunction;

    amplitudeThresholdingCheckbox.addEventListener('change', updateAmplitudeThresholdingUI);

    addRadioButtonListeners();

    filterCheckbox.addEventListener('change', () => {

        updateFilterLabel();
        updateFilterUI();

    });

    for (let i = 0; i < amplitudeThresholdingRadioButtons.length; i++) {

        amplitudeThresholdingRadioButtons[i].addEventListener('click', checkRecordingDurationFunction);

    }

    amplitudeThresholdingCheckbox.addEventListener('click', () => {

        if (amplitudeThresholdingCheckbox.checked) {

            checkRecordingDurationFunction();

        }

    });

    bandPassFilterSlider.on('change', updateFilterLabel);
    lowPassFilterSlider.on('change', updateFilterLabel);
    highPassFilterSlider.on('change', updateFilterLabel);

    amplitudeThresholdingSlider.on('change', updateAmplitudeThresholdingLabel);

    updateFilterUI();
    updateAmplitudeThresholdingUI();

};
