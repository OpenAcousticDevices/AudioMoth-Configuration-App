/****************************************************************************
 * uiAdvanced.js
 * openacousticdevices.info
 * January 2021
 *****************************************************************************/

const acousticConfigCheckBox = document.getElementById('acoustic-config-checkbox');
const locationInChimeCheckbox = document.getElementById('location-in-chime-checkbox');
const locationInChimeLabel = document.getElementById('location-in-chime-label');
const timeZoneInChimeCheckbox = document.getElementById('time-zone-in-chime-checkbox');
const adjustScheduleCheckbox = document.getElementById('adjust-schedule-checkbox');
const adjustScheduleLabel = document.getElementById('adjust-schedule-label');

const extendPrepTimeCheckbox = document.getElementById('extend-prep-time-checkbox');
const filenameWithDeviceIDCheckbox = document.getElementById('filename-device-id-checkbox');
const dailyFolderCheckBox = document.getElementById('daily-folder-checkbox');

const disable48DCFilterCheckbox = document.getElementById('disable-48-dc-filter-checkbox');
const energySaverModeCheckbox = document.getElementById('energy-saver-mode-checkbox');
const lowGainRangeCheckbox = document.getElementById('low-gain-range-checkbox');

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

exports.isLocationInChimeEnabled = () => {

    return locationInChimeCheckbox.checked;

};

exports.isTimeZoneInChimeEnabled = () => {

    return timeZoneInChimeCheckbox.checked;

};

exports.isAdjustScheduleUsingTimezoneFromAcousticChimeEnabled = () => {

    return adjustScheduleCheckbox.checked;

};

exports.getPrerecordingPrepTime = () => {

    return extendPrepTimeCheckbox.checked ? 10 : 2;

};

function setLocationInChimeCheckboxEnabled (enabled) {

    locationInChimeCheckbox.disabled = !enabled;

    if (enabled) {

        locationInChimeLabel.classList.remove('grey');

    } else {

        locationInChimeLabel.classList.add('grey');

    }

}

function setAdjustScheduleCheckboxEnabled (enabled) {

    adjustScheduleCheckbox.disabled = !enabled;

    if (enabled) {

        adjustScheduleLabel.classList.remove('grey');

    } else {

        adjustScheduleLabel.classList.add('grey');

    }

};

exports.fillUI = (settings) => {

    acousticConfigCheckBox.checked = settings.requireAcousticConfig;

    if (settings.requireAcousticConfig) {

        setLocationInChimeCheckboxEnabled(true);

    } else {

        setLocationInChimeCheckboxEnabled(false);

    }

    locationInChimeCheckbox.checked = settings.requireLocationInChime;

    timeZoneInChimeCheckbox.checked = settings.useTimeZoneInChime;

    if (settings.useTimeZoneInChime) {

        setAdjustScheduleCheckboxEnabled(true);

    } else {

        setAdjustScheduleCheckboxEnabled(false);

    }

    adjustScheduleCheckbox.checked = settings.adjustScheduleUsingTimezoneFromAcousticChime;

    const prerecordinPrepTime = settings.prerecordingPrepTime;
    if (prerecordinPrepTime > 2) {

        extendPrepTimeCheckbox.checked = true;

    } else {

        extendPrepTimeCheckbox.checked = false;

    }

    filenameWithDeviceIDCheckbox.checked = settings.filenameWithDeviceIDEnabled;
    dailyFolderCheckBox.checked = settings.dailyFolders;

    disable48DCFilterCheckbox.checked = settings.disable48DCFilter;
    energySaverModeCheckbox.checked = settings.energySaverModeEnabled;
    lowGainRangeCheckbox.checked = settings.lowGainRangeEnabled;

};

exports.prepareUI = (changeFunction) => {

    energySaverModeCheckbox.addEventListener('change', changeFunction);
    dailyFolderCheckBox.addEventListener('change', changeFunction);

    acousticConfigCheckBox.addEventListener('change', () => {

        setLocationInChimeCheckboxEnabled(acousticConfigCheckBox.checked);

    });

    timeZoneInChimeCheckbox.addEventListener('change', () => {

        setAdjustScheduleCheckboxEnabled(timeZoneInChimeCheckbox.checked);

    });

};
