/****************************************************************************
 * uiAdvanced.js
 * openacousticdevices.info
 * January 2021
 *****************************************************************************/

const acousticConfigCheckBox = document.getElementById('acoustic-config-checkbox');
const dailyFolderCheckBox = document.getElementById('daily-folder-checkbox');
const energySaverModeCheckbox = document.getElementById('energy-saver-mode-checkbox');
const lowGainRangeCheckbox = document.getElementById('low-gain-range-checkbox');
const disable48DCFilterCheckbox = document.getElementById('disable-48-dc-filter-checkbox');
const filenameWithDeviceIDCheckbox = document.getElementById('filename-device-id-checkbox');

exports.isAcousticConfigRequired = () => {

    return acousticConfigCheckBox.checked;

};

exports.isDailyFolderEnabled = () => {

    return dailyFolderCheckBox.checked;

};

exports.isEnergySaverModeEnabled = () => {

    return energySaverModeCheckbox.checked;

};

exports.isLowGainRangeEnabled = () => {

    return lowGainRangeCheckbox.checked;

};

exports.is48DCFilterDisabled = () => {

    return disable48DCFilterCheckbox.checked;

};

exports.isFilenameWithDeviceIDEnabled = () => {

    return filenameWithDeviceIDCheckbox.checked;

};

exports.fillUI = (settings) => {

    acousticConfigCheckBox.checked = settings.requireAcousticConfig;
    energySaverModeCheckbox.checked = settings.energySaverModeEnabled;
    lowGainRangeCheckbox.checked = settings.lowGainRangeEnabled;
    disable48DCFilterCheckbox.checked = settings.disable48DCFilter;
    dailyFolderCheckBox.checked = settings.dailyFolders;
    filenameWithDeviceIDCheckbox.checked = settings.filenameWithDeviceIDEnabled;

};

exports.prepareUI = (changeFunction) => {

    energySaverModeCheckbox.addEventListener('change', changeFunction);
    dailyFolderCheckBox.addEventListener('change', changeFunction);

};
