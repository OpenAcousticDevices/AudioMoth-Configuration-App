/****************************************************************************
 * uiAdvanced.js
 * openacousticdevices.info
 * January 2021
 *****************************************************************************/

const electron = require('electron');
const dialog = electron.remote.dialog;

const acousticConfigCheckBox = document.getElementById('acoustic-config-checkbox');
const dailyFolderCheckBox = document.getElementById('daily-folder-checkbox');
const voltageRangeCheckBox = document.getElementById('voltage-range-checkbox');
const energySaverModeCheckbox = document.getElementById('energy-saver-mode-checkbox');
const lowGainRangeCheckbox = document.getElementById('low-gain-range-checkbox');
const disable48DCFilterCheckbox = document.getElementById('disable-48-dc-filter-checkbox');
const gpsTimeCheckbox = document.getElementById('gps-time-checkbox');
const magneticDelayCheckbox = document.getElementById('magnetic-delay-checkbox');

let hardwareWarningDisplayed = false;

exports.isAcousticConfigRequired = () => {

    return acousticConfigCheckBox.checked;

};

exports.isDailyFolderEnabled = () => {

    return dailyFolderCheckBox.checked;

};

exports.displayVoltageRange = () => {

    return voltageRangeCheckBox.checked;

};

exports.isEnergySaverModeEnabled = () => {

    return energySaverModeCheckbox.checked;

};

exports.isLowGainRangeEnabled = () => {

    return lowGainRangeCheckbox.checked;

}

exports.is48DCFilterDisabled = () => {

    return disable48DCFilterCheckbox.checked;

};

exports.istimeSettingFromGPSEnabled = () => {

    return gpsTimeCheckbox.checked;

};

exports.ismagneticSwitchEnabled = () => {

    return magneticDelayCheckbox.checked;

};

exports.fillUI = (settings) => {

    acousticConfigCheckBox.checked = settings.requireAcousticConfig;
    voltageRangeCheckBox.checked = settings.displayVoltageRange;
    energySaverModeCheckbox.checked = settings.energySaverModeEnabled;
    lowGainRangeCheckbox.checked = settings.lowGainRangeEnabled;
    disable48DCFilterCheckbox.checked = settings.disable48DCFilter;
    gpsTimeCheckbox.checked = settings.timeSettingFromGPSEnabled;
    magneticDelayCheckbox.checked = settings.magneticSwitchEnabled;
    dailyFolderCheckBox.checked = settings.dailyFolders;

};

exports.prepareUI = (changeFunction) => {

    energySaverModeCheckbox.addEventListener('change', changeFunction);
    gpsTimeCheckbox.addEventListener('change', changeFunction);
    dailyFolderCheckBox.addEventListener('change', changeFunction);

};

function displayAdditionalHardwareWarning () {

    if (hardwareWarningDisplayed) {

        return;

    }

    dialog.showMessageBox({
        type: 'warning',
        buttons: ['OK'],
        title: 'Additional hardware required',
        message: 'Additional hardware is required to use the GPS time setting and magnetic switch features. Do not use these settings if this hardware is not present.'
    });

    hardwareWarningDisplayed = true;

}

exports.displayAdditionalHardwareWarning = displayAdditionalHardwareWarning;

gpsTimeCheckbox.addEventListener('change', () => {

    if (gpsTimeCheckbox.checked) {

        displayAdditionalHardwareWarning();

    }

});

magneticDelayCheckbox.addEventListener('change', () => {

    if (magneticDelayCheckbox.checked) {

        displayAdditionalHardwareWarning();

    }

});
