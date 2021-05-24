/****************************************************************************
 * uiAdvanced.js
 * openacousticdevices.info
 * January 2021
 *****************************************************************************/

const acousticConfigCheckBox = document.getElementById('acoustic-config-checkbox');
const voltageRangeCheckBox = document.getElementById('voltage-range-checkbox');
const energySaverModeCheckbox = document.getElementById('energy-saver-mode-checkbox');
const disable48DCFilterCheckbox = document.getElementById('disable-48-dc-filter-checkbox');

exports.isAcousticConfigRequired = () => {

    return acousticConfigCheckBox.checked;

};

exports.displayVoltageRange = () => {

    return voltageRangeCheckBox.checked;

};

exports.isEnergySaverModeEnabled = () => {

    return energySaverModeCheckbox.checked;

};

exports.is48DCFilterDisabled = () => {

    return disable48DCFilterCheckbox.checked;

};

exports.fillUI = (settings) => {

    acousticConfigCheckBox.checked = settings.requireAcousticConfig;
    voltageRangeCheckBox.checked = settings.displayVoltageRange;
    energySaverModeCheckbox.checked = settings.energySaverModeEnabled;
    disable48DCFilterCheckbox.checked = settings.disable48DCFilter;

};

exports.prepareUI = (changeFunction) => {

    energySaverModeCheckbox.addEventListener('change', changeFunction);

};
