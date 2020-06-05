/****************************************************************************
 * uiFiltering.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

var constants = require('../constants.js');

const Slider = require('bootstrap-slider');

const SLIDER_STEPS = [100, 100, 100, 100, 200, 500, 500, 1000];

var compressionThresholdValues;

var filterTypeLabel = document.getElementById('filter-type-label');
var filterRadioButtons = document.getElementsByName('filter-radio');
var filterRadioLabels = document.getElementsByName('filter-radio-label');

var highPassRow = document.getElementById('high-pass-row');
var lowPassRow = document.getElementById('low-pass-row');
var bandPassRow = document.getElementById('band-pass-row');

var bandPassMaxLabel = document.getElementById('band-pass-filter-max-label');
var bandPassMinLabel = document.getElementById('band-pass-filter-min-label');
var lowPassMaxLabel = document.getElementById('low-pass-filter-max-label');
var lowPassMinLabel = document.getElementById('low-pass-filter-min-label');
var highPassMaxLabel = document.getElementById('high-pass-filter-max-label');
var highPassMinLabel = document.getElementById('high-pass-min-label');

var filterCheckbox = document.getElementById('filter-checkbox');
var highPassFilterSlider = new Slider('#high-pass-filter-slider', {});
var lowPassFilterSlider = new Slider('#low-pass-filter-slider', {});
var bandPassFilterSlider = new Slider('#band-pass-filter-slider', {});

var filterLabel = document.getElementById('filter-label');

var amplitudeThresholdingMaxLabel = document.getElementById('amplitude-thresholding-max-label');
var amplitudeThresholdingMinLabel = document.getElementById('amplitude-thresholding-min-label');

var amplitudeThresholdingCheckbox = document.getElementById('amplitude-thresholding-checkbox');
var amplitudeThresholdingSlider = new Slider('#amplitude-thresholding-slider', {});
var amplitudeThresholdingLabel = document.getElementById('amplitude-thresholding-label');

const FILTER_LOW = 0;
const FILTER_BAND = 1;
const FILTER_HIGH = 2;
exports.FILTER_LOW = FILTER_LOW;
exports.FILTER_BAND = FILTER_BAND;
exports.FILTER_HIGH = FILTER_HIGH;

var previousSelectionType = 1;

var updateLifeDisplayOnChange;

/* Add last() to Array */

if (!Array.prototype.last) {

    Array.prototype.last = function () {

        return this[this.length - 1];

    };

};

/* Retrieve the radio button selected from a group of named buttons */

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value, 10);

}

function updateFilterSliders () {

    var newSelectionType = getSelectedRadioValue('filter-radio');

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

function updateFilterLabel () {

    var filterIndex, currentBandPassLower, currentBandPassHigher, currentHighPass, currentLowPass;

    filterIndex = getSelectedRadioValue('filter-radio');

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

function calculateSliderPosition (thresholdValue) {

    if (!compressionThresholdValues) calculateCompressionThresholdValues();

    for (let i = 0; i < compressionThresholdValues.length; i++) {

        if (compressionThresholdValues[i] === thresholdValue) {

            return i * 32768 / (compressionThresholdValues.length - 1);

        }

    }

}

function calculateCompressionThresholdValues () {

    var i, j, step;

    step = 2;

    compressionThresholdValues = [0, 2, 4, 6, 8, 10, 12, 14, 16];

    for (i = 0; i < 11; i += 1) {

        for (j = 0; j < 8; j += 1) {

            compressionThresholdValues.push(compressionThresholdValues.last() + step);

        }
        step *= 2;

    }

}

function computeCompressionThreshold () {

    if (!compressionThresholdValues) calculateCompressionThresholdValues();

    return compressionThresholdValues[Math.round((compressionThresholdValues.length - 1) * amplitudeThresholdingSlider.getValue() / 32768)];

}

function updateAmplitudeThresholdingLabel () {

    var threshold = computeCompressionThreshold();

    amplitudeThresholdingLabel.textContent = 'Audio segments with amplitude less than ' + threshold + ' will not be written to the SD card.';

}

function setHighPassSliderValue (value) {

    highPassFilterSlider.setValue(value);

}

function setLowPassSliderValue (value) {

    lowPassFilterSlider.setValue(value);

}

function setBandPass (lowerSliderValue, higherSliderValue) {

    lowerSliderValue = (lowerSliderValue === -1) ? 0 : lowerSliderValue;
    higherSliderValue = (higherSliderValue === -1) ? bandPassFilterSlider.getAttribute('max') : higherSliderValue;

    bandPassFilterSlider.setValue([lowerSliderValue, higherSliderValue]);

}

exports.setFilters = function (enabled, lowerSliderValue, higherSliderValue, filterType) {

    var i;

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

        for (i = 0; i < filterRadioButtons.length; i++) {

            filterRadioButtons[i].checked = (i === filterType);

        }

        updateFilterLabel();

    }

};

exports.setAmplitudeThreshold = function (enabled, amplitudeThreshold) {

    amplitudeThresholdingCheckbox.checked = enabled;

    amplitudeThresholdingSlider.setValue(calculateSliderPosition(amplitudeThreshold));

};

exports.filteringIsEnabled = function () {

    return filterCheckbox.checked;

};

exports.getFilterType = function () {

    return getSelectedRadioValue('filter-radio');

};

exports.getLowerSliderValue = function () {

    var filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return highPassFilterSlider.getValue();
    case FILTER_LOW:
        return 0;
    case FILTER_BAND:
        return Math.min(...bandPassFilterSlider.getValue());

    }

};

exports.getHigherSliderValue = function () {

    var filterIndex = getSelectedRadioValue('filter-radio');

    switch (filterIndex) {

    case FILTER_HIGH:
        return 65535;
    case FILTER_LOW:
        return lowPassFilterSlider.getValue();
    case FILTER_BAND:
        return Math.max(...bandPassFilterSlider.getValue());

    }

};

exports.getamplitudeThreshold = function () {

    return computeCompressionThreshold();

};

exports.amplitudeThresholdingIsEnabled = function () {

    return amplitudeThresholdingCheckbox.checked;

};

/* Enable/disable compression UI based on checkbox */

function updateAmplitudeThresholdingUI () {

    if (amplitudeThresholdingCheckbox.checked) {

        amplitudeThresholdingSlider.enable();
        amplitudeThresholdingMaxLabel.style.color = '';
        amplitudeThresholdingMinLabel.style.color = '';

        amplitudeThresholdingLabel.style.color = '';
        updateAmplitudeThresholdingLabel();

    } else {

        amplitudeThresholdingSlider.disable();
        amplitudeThresholdingMaxLabel.style.color = 'grey';
        amplitudeThresholdingMinLabel.style.color = 'grey';

        amplitudeThresholdingLabel.style.color = 'grey';
        amplitudeThresholdingLabel.textContent = 'All audio segments will be written to the SD card.';

    }

    updateLifeDisplayOnChange();

}

exports.updateAmplitudeThresholdingUI = updateAmplitudeThresholdingUI;

function updateFilterUI () {

    var filterIndex, i;

    filterIndex = getSelectedRadioValue('filter-radio');

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

        for (i = 0; i < filterRadioButtons.length; i++) {

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

        for (i = 0; i < filterRadioButtons.length; i++) {

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

exports.sampleRateChange = function () {

    var sampleRateIndex, sampleRate, maxFreq, currentBandPassHigher, currentBandPassLower, newBandPassHigher, newBandPassLower, labelText, currentLowPass, currentHighPass, newLowPass, newHighPass;

    sampleRateIndex = getSelectedRadioValue('sample-rate-radio');

    sampleRate = constants.configurations[sampleRateIndex].trueSampleRate * 1000;
    maxFreq = sampleRate / 2;

    labelText = (maxFreq / 1000) + 'kHz';

    lowPassMaxLabel.textContent = labelText;
    highPassMaxLabel.textContent = labelText;
    bandPassMaxLabel.textContent = labelText;

    highPassFilterSlider.setAttribute('max', maxFreq);
    lowPassFilterSlider.setAttribute('max', maxFreq);
    bandPassFilterSlider.setAttribute('max', maxFreq);

    highPassFilterSlider.setAttribute('step', SLIDER_STEPS[sampleRateIndex]);
    lowPassFilterSlider.setAttribute('step', SLIDER_STEPS[sampleRateIndex]);
    bandPassFilterSlider.setAttribute('step', SLIDER_STEPS[sampleRateIndex]);

    /* Validate current band-pass filter values */

    currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
    currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());

    newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;

    newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;

    setBandPass(roundToSliderStep(Math.max(newBandPassHigher, newBandPassLower), SLIDER_STEPS[sampleRateIndex]), roundToSliderStep(Math.min(newBandPassHigher, newBandPassLower), SLIDER_STEPS[sampleRateIndex]));

    /* Validate current low-pass filter value */

    currentLowPass = lowPassFilterSlider.getValue();
    newLowPass = currentLowPass > maxFreq ? maxFreq : currentLowPass;
    setLowPassSliderValue(roundToSliderStep(newLowPass, SLIDER_STEPS[sampleRateIndex]));

    /* Validate current high-pass filter value */

    currentHighPass = highPassFilterSlider.getValue();
    newHighPass = currentHighPass > maxFreq ? maxFreq : currentHighPass;
    setHighPassSliderValue(roundToSliderStep(newHighPass, SLIDER_STEPS[sampleRateIndex]));

    updateFilterLabel();

};

/* Add listeners to all radio buttons which update the filter sliders */

function addRadioButtonListeners () {

    var i;

    for (i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].addEventListener('change', function () {

            updateFilterUI();
            updateFilterSliders();
            updateFilterLabel();

        });

    }

}

/* Prepare UI */

exports.prepareUI = function (changeFunction) {

    updateLifeDisplayOnChange = changeFunction;

    amplitudeThresholdingCheckbox.addEventListener('change', updateAmplitudeThresholdingUI);
    filterCheckbox.addEventListener('change', function () {

        updateFilterUI();
        updateFilterLabel();

    });

    addRadioButtonListeners();

    bandPassFilterSlider.on('change', updateFilterLabel);

    lowPassFilterSlider.on('change', updateFilterLabel);

    highPassFilterSlider.on('change', updateFilterLabel);

    amplitudeThresholdingSlider.on('change', updateAmplitudeThresholdingLabel);

    updateFilterUI();
    updateAmplitudeThresholdingUI();

};
