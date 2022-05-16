/****************************************************************************
 * uiFiltering.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

// Filter Playground/Config App each have different methods of initialising Slider

// /* global Slider */
const Slider = require('bootstrap-slider');

// Filter Playground/Config App import functions differently

// /* global enableSlider, disableSlider */
const sliderControl = require('./sliderControl.js');
const enableSlider = sliderControl.enableSlider;
const disableSlider = sliderControl.disableSlider;

const thresholdTypeRadioButtons = document.getElementsByName('threshold-type-radio');

const THRESHOLD_TYPE_NONE = 0;
const THRESHOLD_TYPE_AMPLITUDE = 1;
const THRESHOLD_TYPE_GOERTZEL = 2;

const thresholdHolder = document.getElementById('threshold-holder');
const amplitudeThresholdHolder = document.getElementById('amplitude-threshold-holder');
const goertzelFilterThresholdHolder = document.getElementById('goertzel-filter-threshold-holder');
const thresholdLabel = document.getElementById('threshold-label');

const filterHolder = document.getElementById('filter-holder');

const filterTypeLabel = document.getElementById('filter-type-label');
const filterTypeTable = document.getElementById('filter-type-table');

const thresholdTypeLabel = document.getElementById('threshold-type-label');
const thresholdTypeTable = document.getElementById('threshold-type-table');

const FILTER_SLIDER_STEPS = {8000: 100, 16000: 100, 32000: 100, 48000: 100, 96000: 200, 192000: 500, 250000: 500, 384000: 1000};

const filterRadioLabels = document.getElementsByName('filter-radio-label');
const filterRadioButtons = document.getElementsByName('filter-radio');

const disabledRow = document.getElementById('disabled-row');
const highPassRow = document.getElementById('high-pass-row');
const lowPassRow = document.getElementById('low-pass-row');
const bandPassRow = document.getElementById('band-pass-row');

const disabledMaxLabel = document.getElementById('disabled-filter-max-label');
const disabledMinLabel = document.getElementById('disabled-filter-min-label');
const bandPassMaxLabel = document.getElementById('band-pass-filter-max-label');
const bandPassMinLabel = document.getElementById('band-pass-filter-min-label');
const lowPassMaxLabel = document.getElementById('low-pass-filter-max-label');
const lowPassMinLabel = document.getElementById('low-pass-filter-min-label');
const highPassMaxLabel = document.getElementById('high-pass-filter-max-label');
const highPassMinLabel = document.getElementById('high-pass-min-label');

const disabledFilterSliderHolder = document.getElementById('disabled-filter-slider-holder');
const disabledFilterSlider = new Slider('#disabled-filter-slider', {});

const highPassFilterSlider = new Slider('#high-pass-filter-slider', {});
const highPassFilterSliderHolder = document.getElementById('high-pass-filter-slider-holder');
const lowPassFilterSlider = new Slider('#low-pass-filter-slider', {});
const lowPassFilterSliderHolder = document.getElementById('low-pass-filter-slider-holder');
const bandPassFilterSlider = new Slider('#band-pass-filter-slider', {});
const bandPassFilterSliderHolder = document.getElementById('band-pass-filter-slider-holder');

const filterLabel = document.getElementById('filter-label');

const amplitudeThresholdMaxLabel = document.getElementById('amplitude-threshold-max-label');
const amplitudeThresholdMinLabel = document.getElementById('amplitude-threshold-min-label');

const amplitudeThresholdSliderRow = document.getElementById('amplitude-threshold-slider-row');
const amplitudeThresholdSlider = new Slider('#amplitude-threshold-slider', {});
const amplitudeThresholdSliderHolder = document.getElementById('amplitude-threshold-slider-holder');
const amplitudeThresholdDurationTable = document.getElementById('amplitude-threshold-duration-table');
const amplitudeThresholdDurationRadioButtons = document.getElementsByName('amplitude-threshold-duration-radio');

const VALID_AMPLITUDE_VALUES = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 88, 96, 104, 112, 120, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 352, 384, 416, 448, 480, 512, 576, 640, 704, 768, 832, 896, 960, 1024, 1152, 1280, 1408, 1536, 1664, 1792, 1920, 2048, 2304, 2560, 2816, 3072, 3328, 3584, 3840, 4096, 4608, 5120, 5632, 6144, 6656, 7168, 7680, 8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384, 18432, 20480, 22528, 24576, 26624, 28672, 30720, 32768];

const MINIMUM_TRIGGER_DURATIONS = [0, 1, 2, 5, 10, 15, 30, 60];

// Goertzel filter UI

const GOERTZEL_FILTER_WINDOW_LENGTHS = [16, 32, 64, 128, 256, 512, 1024];

const goertzelFilterCentreSlider = new Slider('#goertzel-filter-slider', {});
const goertzelFilterCentreSliderHolder = document.getElementById('goertzel-filter-slider-holder');
const goertzelFilterMaxLabel = document.getElementById('goertzel-filter-max-label');
const goertzelFilterMinLabel = document.getElementById('goertzel-filter-min-label');
const goertzelFilterWindowRadioButtons = document.getElementsByName('goertzel-filter-window-radio');
const goertzelFilterRow = document.getElementById('goertzel-filter-row');
const goertzelFilterWindowTable = document.getElementById('goertzel-filter-window-table');
const goertzelFilterLabel = document.getElementById('goertzel-filter-label');
const goertzelThresholdSliderHolder = document.getElementById('goertzel-threshold-slider-holder');
const goertzelThresholdSlider = new Slider('#goertzel-threshold-slider', {});
const goertzelThresholdRow = document.getElementById('goertzel-threshold-row');
const goertzelDurationRadioButtons = document.getElementsByName('goertzel-duration-radio');
const goertzelDurationTable = document.getElementById('goertzel-duration-table');

/* Only scale frequency sliders if they have been changed this session */
let passFiltersObserved = false;
let centreObserved = false;

const FILTER_NONE = 3;
const FILTER_LOW = 0;
const FILTER_BAND = 1;
const FILTER_HIGH = 2;

let previousSelectionType = 1;

/* 0: 0-100%, 1: 16-Bit, 2: Decibels */

const THRESHOLD_SCALE_PERCENTAGE = 0;
const THRESHOLD_SCALE_16BIT = 1;
const THRESHOLD_SCALE_DECIBEL = 2;

let thresholdScaleIndex = 0;
let prevThresholdScaleIndex = 0;

let updateLifeDisplayOnChange;

/* All possible slider values */

const THRESHOLD_PERCENTAGE_SLIDER_VALUES = [];
const THRESHOLD_16BIT_SLIDER_VALUES = [];
const THRESHOLD_DECIBEL_SLIDER_VALUES = [];

/* Fill possible slider value lists */

const sliderMin = amplitudeThresholdSlider.getAttribute('min');
const sliderMax = amplitudeThresholdSlider.getAttribute('max');
const sliderStep = amplitudeThresholdSlider.getAttribute('step');

for (let sIndex = sliderMin; sIndex <= sliderMax; sIndex += sliderStep) {

    const rawSlider = sIndex;

    const amplitudeThresholdValues = convertThreshold(rawSlider);

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

/**
 * Retrieve the radio button selected from a group of named buttons
 * @param {string} radioName Name assigned to target radio buttons
 * @returns Index of radio button in the list of all radio buttons with that name
 */
function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value, 10);

}

/**
 * Get the step of the slider for each possible sample rate
 * @param {int} sampleRate Sample rate of file
 * @returns The step value assigned to the slider
 */
function getFilterSliderStep (sampleRate) {

    return FILTER_SLIDER_STEPS[sampleRate];

}

/**
 * Get the filter type index
 * @returns The index of the filter type radio
 */
function getFilterRadioValue () {

    return getSelectedRadioValue('filter-radio');

}

/**
 * If any of the frequency filter sliders have been observed
 */
function getPassFiltersObserved () {

    return passFiltersObserved;

}

function getCentreObserved () {

    return centreObserved;

}

/**
 * Update the filter sliders based on the current filter type and the previous selection
 */
function updateFilterSliders () {

    const newSelectionType = getFilterRadioValue();

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

    if (newSelectionType !== FILTER_NONE) {

        previousSelectionType = newSelectionType;

    }

}

/**
 * Update the text on the label which describes the range of frequencies covered by the filter
 */
function updateFilterLabel () {

    const filterIndex = getFilterRadioValue();

    let currentBandPassLower, currentBandPassHigher, currentHighPass, currentLowPass;

    switch (filterIndex) {

    case FILTER_NONE:
        return;
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

/**
 * Work out where on the slider a given amplitude threshold value is
 * @param {int} amplitudeThreshold Chosen threshold
 * @param {int} scaleIndex Index of amplitude trheshold scale type (THRESHOLD_SCALE_PERCENTAGE, THRESHOLD_SCALE_16BIT, THRESHOLD_SCALE_DECIBEL)
 * @returns The corresponding slider value
 */

function lookupAmplitudeThresholdSliderValue (amplitudeThreshold, scaleIndex) {

    let searchList;

    switch (scaleIndex) {

    case THRESHOLD_SCALE_PERCENTAGE:
        searchList = THRESHOLD_PERCENTAGE_SLIDER_VALUES;
        break;

    case THRESHOLD_SCALE_16BIT:
        searchList = THRESHOLD_16BIT_SLIDER_VALUES;
        break;

    case THRESHOLD_SCALE_DECIBEL:
        searchList = THRESHOLD_DECIBEL_SLIDER_VALUES;
        break;

    }

    for (let i = 0; i < searchList.length; i++) {

        if (searchList[i] === amplitudeThreshold) {

            return i;

        }

    }

    return 0;

}

/**
 * Convert exponent and mantissa into a string
 * @param {float} mantissa Percentage mantissa
 * @param {int} exponent Percentage exponent
 * @returns String representation of the percentage
 */
function formatPercentage (mantissa, exponent) {

    let response = '';

    if (exponent < 0) {

        response += '0.0000'.substring(0, 1 - exponent);

    }

    response += mantissa;

    for (let i = 0; i < exponent; i += 1) response += '0';

    return response;

}

/**
 * Calculate the amplitude threshold in the currently enabled scale
 * @param {int} rawSlider The value returned by the slider
 * @returns Object containing the converted values
 */
function convertThreshold (rawSlider) {

    let exponent, mantissa, validAmplitude;

    const sliderMax = amplitudeThresholdSlider.getAttribute('max');
    const scaledSlider = rawSlider / sliderMax;

    const rawLog = (100 * scaledSlider - 100);

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

/**
 * Update the information label which displays the threshold information
 */
function updateThresholdLabel () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE) {

        thresholdLabel.classList.remove('grey');

        const amplitudeThreshold = convertThreshold(amplitudeThresholdSlider.getValue());

        thresholdLabel.textContent = 'Amplitude threshold of ';

        switch (thresholdScaleIndex) {

        case THRESHOLD_SCALE_PERCENTAGE:

            thresholdLabel.textContent += amplitudeThreshold.percentage + '%';
            break;

        case THRESHOLD_SCALE_16BIT:

            thresholdLabel.textContent += amplitudeThreshold.amplitude;
            break;

        case THRESHOLD_SCALE_DECIBEL:

            thresholdLabel.textContent += amplitudeThreshold.decibels + ' dB';
            break;

        }

        thresholdLabel.textContent += ' will be used when generating T.WAV files.';

    } else if (thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL) {

        const goertzelFrequency = goertzelFilterCentreSlider.getValue() / 1000;
        const goertzelThresholdPercentage = convertThreshold(goertzelThresholdSlider.getValue()).percentage;

        thresholdLabel.classList.remove('grey');

        thresholdLabel.textContent = 'Threshold of ';
        thresholdLabel.textContent += goertzelThresholdPercentage + '%';
        thresholdLabel.textContent += ' will be used when generating T.WAV files.';

        goertzelFilterLabel.textContent = 'A centre frequency of ' + goertzelFrequency.toFixed(1) + ' kHz will be used by the frequency trigger.';

    } else {

        thresholdLabel.classList.add('grey');

        thresholdLabel.textContent = 'All audio will be written to a WAV file.';

    }

}

/**
 * Set the high-pass filter values to given value
 * @param {int} value New value
 */
function setHighPassSliderValue (value) {

    highPassFilterSlider.setValue(value);

}

/**
 * Set the low-pass filter values to given value
 * @param {int} value New value
 */
function setLowPassSliderValue (value) {

    lowPassFilterSlider.setValue(value);

}

/**
 * Set the band-pass filter values to 2 given values
 * @param {int} lowerSliderValue New lower value
 * @param {int} higherSliderValue New higher value
 */
function setBandPass (lowerSliderValue, higherSliderValue) {

    lowerSliderValue = (lowerSliderValue === -1) ? 0 : lowerSliderValue;
    higherSliderValue = (higherSliderValue === -1) ? bandPassFilterSlider.getAttribute('max') : higherSliderValue;

    bandPassFilterSlider.setValue([lowerSliderValue, higherSliderValue]);

}

/**
 * Exported functions for setting values
 * @param {bool} enabled Whether or not the filter should be on
 * @param {int} lowerSliderValue New lower value
 * @param {int} higherSliderValue New higher value
 * @param {string} filterType Name of filter type ('none', 'low', 'band', 'high')
 */
function setFilters (enabled, lowerSliderValue, higherSliderValue, filterType) {

    passFiltersObserved = enabled;

    let filterTypeIndex = FILTER_NONE;

    setLowPassSliderValue(higherSliderValue);
    setHighPassSliderValue(lowerSliderValue);
    setBandPass(lowerSliderValue, higherSliderValue);

    switch (filterType) {

    case 'low':
        filterTypeIndex = FILTER_LOW;
        break;

    case 'high':
        filterTypeIndex = FILTER_HIGH;
        break;

    case 'band':
        filterTypeIndex = FILTER_BAND;
        break;

    }

    for (let i = 0; i < filterRadioButtons.length; i++) {

        if (parseInt(filterRadioButtons[i].value) === filterTypeIndex) {

            filterRadioButtons[i].checked = true;

        }

    }

    updateFilterLabel();

}

/**
 * Change amplitude threshold scale
 * @param {int} scaleIndex New scale index (THRESHOLD_SCALE_PERCENTAGE, THRESHOLD_SCALE_16BIT, THRESHOLD_SCALE_DECIBEL)
 */
function setAmplitudeThresholdScaleIndex (scaleIndex) {

    prevThresholdScaleIndex = thresholdScaleIndex;

    thresholdScaleIndex = scaleIndex;
    updateAmplitudeThresholdScale();

}

/**
 * Change amplitude threshold
 * @param {int} amplitudeThreshold New amplitude threshold
 */
function setAmplitudeThreshold (amplitudeThreshold) {

    amplitudeThresholdSlider.setValue(lookupAmplitudeThresholdSliderValue(amplitudeThreshold, thresholdScaleIndex));

}

/**
 * Change amplitude threshold type
 * @param {int} type Index of threshold type (THRESHOLD_TYPE_NONE, THRESHOLD_TYPE_AMPLITUDE, THRESHOLD_TYPE_GOERTZEL)
 */
function setThresholdType (type) {

    thresholdTypeRadioButtons[type].checked = true;
    updateThresholdTypeUI();

}

/**
 * Change minimum duration of amplitude threshold
 * @param {int} index Index of amplitude threshold duration radio button to check
 */
function setMinimumAmplitudeThresholdDuration (index) {

    amplitudeThresholdDurationRadioButtons[index].checked = true;
    goertzelDurationRadioButtons[index].checked = true;

}

/**
 * Change frequency threshold value
 * @param {int} frequencyTrigger New frequency threshold
 */
function setFrequencyTrigger (frequencyTrigger) {

    goertzelThresholdSlider.setValue(lookupAmplitudeThresholdSliderValue(frequencyTrigger, THRESHOLD_SCALE_PERCENTAGE));

}

/**
 * Change the centre frequency used by the Goertzel filter
 * @param {int} freq New centre frequency
 */
function setFrequencyTriggerFilterFreq (freq) {

    goertzelFilterCentreSlider.setValue(freq);

}

/**
 * If the Goertzel centre has been observed (either directly or previously by whoever created the loaded config), the slider shouldn't be reset when the sample rate changes
 * @param {bool} isObserved Has the centre slider been observed
 */
function setCentreObserved (isObserved) {

    centreObserved = isObserved;

}

/**
 * If the Goertzel filters have been observed (either directly or previously by whoever created the loaded config), the slider shouldn't be reset when the sample rate changes
 * @param {bool} isObserved Has the centre slider been observed
 */
function setPassFiltersObserved (isObserved) {

    passFiltersObserved = isObserved;

}

/**
 * Change the window length used by the Goertzel filter
 * @param {int} length New window length
 */
function setFrequencyTriggerWindowLength (length) {

    const index = GOERTZEL_FILTER_WINDOW_LENGTHS.indexOf(length);

    goertzelFilterWindowRadioButtons[index].checked = true;

}

/**
 * Change frequency threshold minimum duration
 * @param {int} index Index of radio button which controls the minimum duration of the frequency threshold
 */
function setMinimumFrequencyTriggerDuration (index) {

    goertzelDurationRadioButtons[index].checked = true;
    amplitudeThresholdDurationRadioButtons[index].checked = true;

}

/**
 * Is pre-threshold filtering enabled
 * @returns Boolean reflecting if pre-threshold filtering is enabled
 */
function filteringIsEnabled () {

    const filterIndex = getFilterRadioValue();

    return filterIndex !== FILTER_NONE;

}

/**
 * Get filter type used before threshold
 * @returns String describing filter type ('low', 'band', 'high', 'none')
 */
function getFilterType () {

    const filterIndex = getFilterRadioValue();
    const filterTypes = ['low', 'band', 'high', 'none'];

    return filterTypes[filterIndex];

}

/**
 * Get lowest filter value on currently enabled slider
 * @returns If no filter is enabled, return 0. If high-pass enabled, return filter value. If low-pass enabled, return 0. If band-pass enabled, return lower of the two filter values
 */
function getLowerSliderValue () {

    const filterIndex = getFilterRadioValue();

    switch (filterIndex) {

    case FILTER_NONE:
        return 0;
    case FILTER_HIGH:
        return highPassFilterSlider.getValue();
    case FILTER_LOW:
        return 0;
    case FILTER_BAND:
        return Math.min(...bandPassFilterSlider.getValue());

    }

}

/**
 * Get highest filter value on currently enabled slider
 * @returns If no filter is enabled, return 0. If high-pass enabled, return 0. If low-pass enabled, return filter value. If band-pass enabled, return higher of the two filter values
 */
function getHigherSliderValue () {

    const filterIndex = getFilterRadioValue();

    switch (filterIndex) {

    case FILTER_NONE:
        return 0;
    case FILTER_HIGH:
        return 65535;
    case FILTER_LOW:
        return lowPassFilterSlider.getValue();
    case FILTER_BAND:
        return Math.max(...bandPassFilterSlider.getValue());

    }

}

/**
 * Get amplitude threshold in 16-bit scale
 * @returns Amplitude threshold
 */
function get16BitAmplitudeThreshold () {

    return convertThreshold(amplitudeThresholdSlider.getValue()).amplitude;

}

/**
 * Get amplitude threshold in percentage scale
 * @returns Amplitude threshold
 */
function getPercentageAmplitudeThreshold () {

    return convertThreshold(amplitudeThresholdSlider.getValue()).percentage;

}

/**
 * Get amplitude threshold in decibel scale
 * @returns Amplitude threshold
 */
function getDecibelAmplitudeThreshold () {

    return convertThreshold(amplitudeThresholdSlider.getValue()).decibels;

}

/**
 * Get amplitude threshold in percentage scale, split into exponent and mantissa
 * @returns Object containing exponent and mantissa
 */
function getPercentageAmplitudeThresholdExponentMantissa () {

    const results = convertThreshold(amplitudeThresholdSlider.getValue());

    return {
        exponent: results.percentageExponent,
        mantissa: results.percentageMantissa
    };

}

/**
 * Get all amplitude threshold in all possible scales
 * @returns Object containing all amplitude threshold conversions
 */
function getAmplitudeThresholdValues () {

    return convertThreshold(amplitudeThresholdSlider.getValue());

}

/**
 * Get all frequency threshold in all possible scales
 * @returns Object containing all frequency threshold conversions
 */
function getFrequencyTriggerValues () {

    return convertThreshold(goertzelThresholdSlider.getValue());

}

/**
 * Get amplitude threshold scaled to currently selected scale
 * @returns Amplitude threshold
 */
function getAmplitudeThreshold () {

    switch (thresholdScaleIndex) {

    case THRESHOLD_SCALE_PERCENTAGE:
        return getPercentageAmplitudeThreshold();

    case THRESHOLD_SCALE_16BIT:
        return get16BitAmplitudeThreshold();

    case THRESHOLD_SCALE_DECIBEL:
        return getDecibelAmplitudeThreshold();

    }

}

/**
 * Get whether or not to amplitude threshold
 * @returns Boolean representing whether or not amplitude thresholdins enabled
 */
function amplitudeThresholdIsEnabled () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    return thresholdTypeIndex === THRESHOLD_TYPE_AMPLITUDE;

}

/**
 * Get index of amplitude threshold scale
 * @returns Index of amplitude scale (THRESHOLD_SCALE_PERCENTAGE, THRESHOLD_SCALE_16BIT, THRESHOLD_SCALE_DECIBEL)
 */
function getAmplitudeThresholdScaleIndex () {

    return thresholdScaleIndex;

}

/**
 * Get current minimum duration of amplitude threshold
 * @returns Minimum amplitude threshold duration
 */
function getMinimumAmplitudeThresholdDuration () {

    return getSelectedRadioValue('amplitude-threshold-duration-radio');

}

/**
 * Get frequency threshold value as exponent and mantissa
 * @returns Object containing mantissa and exponent
 */
function getFrequencyFilterThresholdExponentMantissa () {

    const results = convertThreshold(goertzelThresholdSlider.getValue());

    return {
        exponent: results.percentageExponent,
        mantissa: results.percentageMantissa
    };

}

/**
 * Convert selected frequency threshold from current scale raw slider value to amplitude
 * @returns Frequency threshold value
 */
function getFrequencyTrigger () {

    return parseFloat(convertThreshold(goertzelThresholdSlider.getValue()).percentage);

}

/**
 * Get Goertzel filter frequency for threshold
 * @returns Frequency used by Goertzel filter
 */
function getFrequencyTriggerFilterFreq () {

    return goertzelFilterCentreSlider.getValue();

}

/**
 * Get whether or not to apply frequency filter
 * @returns Boolean representing if frequency filter is enabled
 */
function frequencyTriggerIsEnabled () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    return thresholdTypeIndex === THRESHOLD_TYPE_GOERTZEL;

}

/**
 * Get Goertzel filter window length for threshold
 * @returns Window length
 */
function getFrequencyTriggerWindowLength () {

    return GOERTZEL_FILTER_WINDOW_LENGTHS[getSelectedRadioValue('goertzel-filter-window-radio')];

}

function getMinimumFrequencyTriggerDuration () {

    return getSelectedRadioValue('goertzel-duration-radio');

}

/**
 * Get minimum trigger duration used by the frequency threshold
 * @returns Minimum trigger duration
 */
function getMinimumTriggerDurationGoertzel () {

    return MINIMUM_TRIGGER_DURATIONS[getSelectedRadioValue('goertzel-duration-radio')];

}

/**
 * Get minimum trigger duration used by the amplitude threshold
 * @returns Minimum trigger duration
 */
function getMinimumTriggerDurationAmp () {

    return MINIMUM_TRIGGER_DURATIONS[getSelectedRadioValue('amplitude-threshold-duration-radio')];

}

/**
 * Enable/disable threshold UI based on checkbox
 */
function updateThresholdUI () {

    updateThresholdLabel();

    if (updateLifeDisplayOnChange) {

        updateLifeDisplayOnChange();

    }

}

/**
 * Check if the filtering UI should be enabled and update accordingly
 */
function updateFilterUI () {

    const filterIndex = getFilterRadioValue();

    switch (filterIndex) {

    case FILTER_NONE:
        disabledRow.style.display = 'flex';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_LOW:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'flex';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_HIGH:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'flex';
        bandPassRow.style.display = 'none';
        break;
    case FILTER_BAND:
        disabledRow.style.display = 'none';
        lowPassRow.style.display = 'none';
        highPassRow.style.display = 'none';
        bandPassRow.style.display = 'flex';
        break;

    }

    if (filterIndex !== FILTER_NONE) {

        filterLabel.classList.remove('grey');

    } else {

        filterLabel.textContent = 'Recordings will not be filtered.';
        filterLabel.classList.add('grey');

    }

}

/**
 * When sample rate changes, so does the slider step. Update values to match the corresponding step
 * @param {int} value Slider value
 * @param {int} step Slider step
 * @returns Scaled slider value
 */
function roundToSliderStep (value, step) {

    return Math.round(value / step) * step;

}

/**
 * Update UI according to new sample rate selection
 * @param {bool} resetPassSliders Whether or not to set pass sliders back to defaults
 * @param {bool} resetCentreSliders Whether or not to set Goertzel filter centre slider back to default
 * @param {int} sampleRate New sample rate
 */
function sampleRateChange (resetPassSliders, resetCentreSlider, sampleRate) {

    const maxFreq = sampleRate / 2;

    const labelText = (maxFreq / 1000) + 'kHz';

    disabledMaxLabel.textContent = labelText;
    lowPassMaxLabel.textContent = labelText;
    highPassMaxLabel.textContent = labelText;
    bandPassMaxLabel.textContent = labelText;
    goertzelFilterMaxLabel.textContent = labelText;

    highPassFilterSlider.setAttribute('max', maxFreq);
    lowPassFilterSlider.setAttribute('max', maxFreq);
    bandPassFilterSlider.setAttribute('max', maxFreq);
    goertzelFilterCentreSlider.setAttribute('max', maxFreq);

    const filterSliderStep = FILTER_SLIDER_STEPS[sampleRate];

    highPassFilterSlider.setAttribute('step', filterSliderStep);
    lowPassFilterSlider.setAttribute('step', filterSliderStep);
    bandPassFilterSlider.setAttribute('step', filterSliderStep);
    goertzelFilterCentreSlider.setAttribute('step', filterSliderStep);

    /* Get current slider values */

    const currentBandPassHigher = Math.max(...bandPassFilterSlider.getValue());
    const currentBandPassLower = Math.min(...bandPassFilterSlider.getValue());
    const currentLowPass = lowPassFilterSlider.getValue();
    const currentHighPass = highPassFilterSlider.getValue();

    /* Reset pass sliders */

    if (resetPassSliders) {

        /* Set high/low-pass sliders to 1/4 and 3/4 of the bar if filtering has not yet been enabled */

        const newLowPassFreq = maxFreq / 4;
        const newHighPassFreq = 3 * maxFreq / 4;

        /* Set band-pass filter values */

        setBandPass(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRate]), roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

        /* Set low-pass filter value */

        setLowPassSliderValue(roundToSliderStep(newHighPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

        /* Set high-pass filter value */

        setHighPassSliderValue(roundToSliderStep(newLowPassFreq, FILTER_SLIDER_STEPS[sampleRate]));

    } else {

        /* Validate current band-pass filter values */

        const newBandPassLower = currentBandPassLower > maxFreq ? 0 : currentBandPassLower;
        const newBandPassHigher = currentBandPassHigher > maxFreq ? maxFreq : currentBandPassHigher;
        setBandPass(roundToSliderStep(Math.max(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRate]), roundToSliderStep(Math.min(newBandPassHigher, newBandPassLower), FILTER_SLIDER_STEPS[sampleRate]));

        /* Validate current low-pass filter value */

        const newLowPass = currentLowPass > maxFreq ? maxFreq : currentLowPass;
        setLowPassSliderValue(roundToSliderStep(newLowPass, FILTER_SLIDER_STEPS[sampleRate]));

        /* Validate current high-pass filter value */

        const newHighPass = currentHighPass > maxFreq ? maxFreq : currentHighPass;
        setHighPassSliderValue(roundToSliderStep(newHighPass, FILTER_SLIDER_STEPS[sampleRate]));

    }

    /* Reset frequency threshold centre slider */

    const currentGoertzel = goertzelFilterCentreSlider.getValue();
    let newCentre;

    if (resetCentreSlider) {

        newCentre = maxFreq / 2;

    } else {

        newCentre = currentGoertzel > maxFreq ? maxFreq : currentGoertzel;

    }

    setFrequencyTriggerFilterFreq(roundToSliderStep(newCentre, FILTER_SLIDER_STEPS[sampleRate]));

    /* Update labels */

    updateFilterLabel();
    updateThresholdLabel();

}

/**
 * Update the labels either side of the amplitude threshold scale
 */
function updateAmplitudeThresholdScale () {

    updateThresholdLabel();

    switch (thresholdScaleIndex) {

    case THRESHOLD_SCALE_PERCENTAGE:
        amplitudeThresholdMinLabel.innerHTML = '0.001%';
        amplitudeThresholdMaxLabel.innerHTML = '100%';
        break;

    case THRESHOLD_SCALE_16BIT:
        amplitudeThresholdMinLabel.innerHTML = '0';
        amplitudeThresholdMaxLabel.innerHTML = '32768';
        break;

    case THRESHOLD_SCALE_DECIBEL:
        amplitudeThresholdMinLabel.innerHTML = '-100 dB';
        amplitudeThresholdMaxLabel.innerHTML = '0 dB';
        break;

    }

}

/**
 * Get value of current threshold type (THRESHOLD_TYPE_NONE, THRESHOLD_TYPE_AMPLITUDE, THRESHOLD_TYPE_GOERTZEL)
 */
function getThresholdTypeIndex () {

    return getSelectedRadioValue('threshold-type-radio');

}

/**
 * Update UI based on which threshold type is selected
 */
function updateThresholdTypeUI () {

    const thresholdTypeIndex = getThresholdTypeIndex();

    switch (thresholdTypeIndex) {

    case THRESHOLD_TYPE_NONE:

        amplitudeThresholdHolder.style.display = 'none';
        goertzelFilterThresholdHolder.style.display = 'none';

        thresholdHolder.style.display = 'none';

        filterHolder.style.display = '';

        break;

    case THRESHOLD_TYPE_AMPLITUDE:

        amplitudeThresholdHolder.style.display = '';
        goertzelFilterThresholdHolder.style.display = 'none';

        thresholdHolder.style.display = '';

        filterHolder.style.display = '';

        break;

    case THRESHOLD_TYPE_GOERTZEL:

        amplitudeThresholdHolder.style.display = 'none';
        goertzelFilterThresholdHolder.style.display = '';

        thresholdHolder.style.display = '';

        filterHolder.style.display = 'none';

        break;

    }

}

/**
 * Add listeners to all radio buttons which update the filter sliders
 * @param {function} filterValueChangeFunction Function called when values associated with the filter (sample rate, slider value, filter type) change
 */
function addFilterRadioButtonListeners (filterValueChangeFunction) {

    for (let i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].addEventListener('change', function () {

            updateFilterUI();
            updateFilterSliders();
            updateFilterLabel();

            if (filterRadioButtons[i].value !== FILTER_NONE) {

                passFiltersObserved = true;

            }

            // If a Goertzel value has been changed, don't rescale the values to defaults as sample rate changes
            filterValueChangeFunction(!passFiltersObserved, !centreObserved);

        });

    }

}

/**
 * Disable UI elements
 */
function disableFilterUI () {

    thresholdTypeLabel.classList.add('grey');
    thresholdTypeTable.classList.add('grey');

    for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

        thresholdTypeRadioButtons[i].disabled = true;

    }

    filterTypeLabel.classList.add('grey');
    filterTypeTable.classList.add('grey');

    for (let i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].disabled = true;

    }

    lowPassRow.classList.add('grey');
    highPassRow.classList.add('grey');
    bandPassRow.classList.add('grey');

    disableSlider(lowPassFilterSlider, lowPassFilterSliderHolder);
    disableSlider(highPassFilterSlider, highPassFilterSliderHolder);
    disableSlider(bandPassFilterSlider, bandPassFilterSliderHolder);

    filterLabel.classList.add('grey');

    // Amplitude threshold settings

    amplitudeThresholdDurationTable.classList.add('grey');

    for (let i = 0; i < amplitudeThresholdDurationRadioButtons.length; i++) {

        amplitudeThresholdDurationRadioButtons[i].disabled = true;

    }

    amplitudeThresholdSliderRow.classList.add('grey');

    disableSlider(amplitudeThresholdSlider, amplitudeThresholdSliderHolder);

    thresholdLabel.classList.add('grey');

    // Frequency settings

    goertzelFilterWindowTable.classList.add('grey');

    for (let i = 0; i < goertzelFilterWindowRadioButtons.length; i++) {

        goertzelFilterWindowRadioButtons[i].disabled = true;

    }

    goertzelFilterRow.classList.add('grey');

    disableSlider(goertzelFilterCentreSlider, goertzelFilterCentreSliderHolder);

    goertzelDurationTable.classList.add('grey');

    for (let i = 0; i < goertzelDurationRadioButtons.length; i++) {

        goertzelDurationRadioButtons[i].disabled = true;

    }

    goertzelThresholdRow.classList.add('grey');

    disableSlider(goertzelThresholdSlider, goertzelThresholdSliderHolder);

    goertzelFilterLabel.classList.add('grey');

}

/**
 * Enable UI elements
 */
function enableFilterUI () {

    thresholdTypeLabel.classList.remove('grey');
    thresholdTypeTable.classList.remove('grey');

    for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

        thresholdTypeRadioButtons[i].disabled = false;

    }

    filterTypeLabel.classList.remove('grey');
    filterTypeTable.classList.remove('grey');

    for (let i = 0; i < filterRadioButtons.length; i++) {

        filterRadioButtons[i].disabled = false;

    }

    lowPassRow.classList.remove('grey');
    highPassRow.classList.remove('grey');
    bandPassRow.classList.remove('grey');

    enableSlider(lowPassFilterSlider, lowPassFilterSliderHolder);
    enableSlider(highPassFilterSlider, highPassFilterSliderHolder);
    enableSlider(bandPassFilterSlider, bandPassFilterSliderHolder);

    updateFilterUI();

    // Amplitude threshold settings

    amplitudeThresholdDurationTable.classList.remove('grey');

    for (let i = 0; i < amplitudeThresholdDurationRadioButtons.length; i++) {

        amplitudeThresholdDurationRadioButtons[i].disabled = false;

    }

    amplitudeThresholdSliderRow.classList.remove('grey');

    enableSlider(amplitudeThresholdSlider, amplitudeThresholdSliderHolder);

    thresholdLabel.classList.remove('grey');

    // Frequency settings

    goertzelFilterWindowTable.classList.remove('grey');

    for (let i = 0; i < goertzelFilterWindowRadioButtons.length; i++) {

        goertzelFilterWindowRadioButtons[i].disabled = false;

    }

    goertzelFilterRow.classList.remove('grey');

    enableSlider(goertzelFilterCentreSlider, goertzelFilterCentreSliderHolder);

    goertzelDurationTable.classList.remove('grey');

    for (let i = 0; i < goertzelDurationRadioButtons.length; i++) {

        goertzelDurationRadioButtons[i].disabled = false;

    }

    goertzelThresholdRow.classList.remove('grey');

    enableSlider(goertzelThresholdSlider, goertzelThresholdSliderHolder);

    goertzelFilterLabel.classList.remove('grey');

}

/**
 * Reset the values of all elements to defaults
 */
function resetElements () {

    filterRadioButtons[0].checked = true;
    amplitudeThresholdDurationRadioButtons[0].checked = true;

    amplitudeThresholdSlider.setValue(0);

    goertzelThresholdSlider.setValue(0);

    goertzelFilterWindowRadioButtons[2].checked = true;
    goertzelDurationRadioButtons[0].checked = true;

    previousSelectionType = 1;

    thresholdTypeRadioButtons[0].checked = true;

}

/**
 * Prepare UI
 * @param {function} changeFunction Function called when values which would affect life calculations change
 * @param {function} checkRecordingDurationFunction Function called if recording length should be validated
 * @param {function} filterValueChangeFunction Function called when values associated with the filter (sample rate, slider value, filter type) change
 */
function prepareUI (changeFunction, checkRecordingDurationFunction, filterValueChangeFunction) {

    if (changeFunction) {

        updateLifeDisplayOnChange = changeFunction;

    }

    addFilterRadioButtonListeners(filterValueChangeFunction);

    for (let i = 0; i < thresholdTypeRadioButtons.length; i++) {

        thresholdTypeRadioButtons[i].addEventListener('change', () => {

            updateThresholdTypeUI();
            updateThresholdLabel();

            if (updateLifeDisplayOnChange) {

                updateLifeDisplayOnChange();

            }

        });

    }

    thresholdTypeRadioButtons[2].addEventListener('change', () => {

        centreObserved = true;

    });

    if (checkRecordingDurationFunction) {

        for (let i = 0; i < amplitudeThresholdDurationRadioButtons.length; i++) {

            amplitudeThresholdDurationRadioButtons[i].addEventListener('click', checkRecordingDurationFunction);
            goertzelDurationRadioButtons[i].addEventListener('click', checkRecordingDurationFunction);

        }

    }

    for (let i = 0; i < amplitudeThresholdDurationRadioButtons.length; i++) {

        // Sync duration checkboxes

        amplitudeThresholdDurationRadioButtons[i].addEventListener('change', () => {

            goertzelDurationRadioButtons[i].checked = true;

        });

        goertzelDurationRadioButtons[i].addEventListener('change', () => {

            amplitudeThresholdDurationRadioButtons[i].checked = true;

        });

    }

    // Disable interactions with disabled slider

    disabledFilterSlider.disable();

    const children = disabledFilterSliderHolder.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {

        if (children[i].style) {

            children[i].style.cursor = 'not-allowed';

        }

    }

    // Add slider listeners

    bandPassFilterSlider.on('change', updateFilterLabel);
    lowPassFilterSlider.on('change', updateFilterLabel);
    highPassFilterSlider.on('change', updateFilterLabel);

    amplitudeThresholdSlider.on('change', updateThresholdLabel);
    goertzelThresholdSlider.on('change', updateThresholdLabel);

    goertzelFilterCentreSlider.on('change', updateThresholdLabel);

    updateThresholdTypeUI();

    const thresholdTypeIndex = getThresholdTypeIndex();

    if (thresholdTypeIndex !== THRESHOLD_TYPE_NONE && checkRecordingDurationFunction) {

        checkRecordingDurationFunction();

    }

    updateFilterUI();
    updateThresholdUI();

}

/* Exports */

exports.THRESHOLD_TYPE_NONE = THRESHOLD_TYPE_NONE;
exports.THRESHOLD_TYPE_AMPLITUDE = THRESHOLD_TYPE_AMPLITUDE;
exports.THRESHOLD_TYPE_GOERTZEL = THRESHOLD_TYPE_GOERTZEL;

exports.FILTER_NONE = FILTER_NONE;
exports.FILTER_LOW = FILTER_LOW;
exports.FILTER_BAND = FILTER_BAND;
exports.FILTER_HIGH = FILTER_HIGH;

exports.getFilterSliderStep = getFilterSliderStep;

exports.getFilterRadioValue = getFilterRadioValue;

exports.setFilters = setFilters;

exports.setAmplitudeThresholdScaleIndex = setAmplitudeThresholdScaleIndex;

exports.setAmplitudeThreshold = setAmplitudeThreshold;

exports.setThresholdType = setThresholdType;
exports.getThresholdTypeIndex = getThresholdTypeIndex;

exports.setMinimumAmplitudeThresholdDuration = setMinimumAmplitudeThresholdDuration;

exports.setFrequencyTrigger = setFrequencyTrigger;

exports.setFrequencyTriggerFilterFreq = setFrequencyTriggerFilterFreq;

exports.setFrequencyTriggerWindowLength = setFrequencyTriggerWindowLength;

exports.setMinimumFrequencyTriggerDuration = setMinimumFrequencyTriggerDuration;

exports.filteringIsEnabled = filteringIsEnabled;

exports.getFilterType = getFilterType;

exports.getLowerSliderValue = getLowerSliderValue;
exports.getHigherSliderValue = getHigherSliderValue;

exports.setPassFiltersObserved = setPassFiltersObserved;

exports.getAmplitudeThreshold = getAmplitudeThreshold;
exports.amplitudeThresholdIsEnabled = amplitudeThresholdIsEnabled;
exports.getAmplitudeThresholdScaleIndex = getAmplitudeThresholdScaleIndex;
exports.get16BitAmplitudeThreshold = get16BitAmplitudeThreshold;
exports.getPercentageAmplitudeThreshold = getPercentageAmplitudeThreshold;
exports.getDecibelAmplitudeThreshold = getDecibelAmplitudeThreshold;
exports.getPercentageAmplitudeThresholdExponentMantissa = getPercentageAmplitudeThresholdExponentMantissa;

exports.getAmplitudeThresholdValues = getAmplitudeThresholdValues;
exports.getFrequencyTriggerValues = getFrequencyTriggerValues;

exports.getMinimumAmplitudeThresholdDuration = getMinimumAmplitudeThresholdDuration;

exports.frequencyTriggerIsEnabled = frequencyTriggerIsEnabled;
exports.getFrequencyTrigger = getFrequencyTrigger;
exports.getFrequencyTriggerFilterFreq = getFrequencyTriggerFilterFreq;
exports.getFrequencyTriggerWindowLength = getFrequencyTriggerWindowLength;
exports.getFrequencyFilterThresholdExponentMantissa = getFrequencyFilterThresholdExponentMantissa;
exports.getMinimumFrequencyTriggerDuration = getMinimumFrequencyTriggerDuration;

exports.getMinimumTriggerDurationGoertzel = getMinimumTriggerDurationGoertzel;
exports.getMinimumTriggerDurationAmp = getMinimumTriggerDurationAmp;

exports.updateThresholdUI = updateThresholdUI;
exports.updateFilterUI = updateFilterUI;
exports.sampleRateChange = sampleRateChange;
exports.resetElements = resetElements;

exports.getPassFiltersObserved = getPassFiltersObserved;
exports.getCentreObserved = getCentreObserved;
exports.setCentreObserved = setCentreObserved;

exports.prepareUI = prepareUI;
