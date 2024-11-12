/****************************************************************************
 * uiAddons.js
 * openacousticdevices.info
 * October 2024
 *****************************************************************************/

const {dialog} = require('@electron/remote');

const magneticDelayCheckbox = document.getElementById('magnetic-delay-checkbox');
const gpsFixTimeCheckbox = document.getElementById('gps-time-checkbox');
const gpsBeforeAfterSelect = document.getElementById('gps-before-after-select');
const gpsBeforeAfterLabel = document.getElementById('gps-before-after-label');
const gpsFixTimeSelect = document.getElementById('gps-time-select');
const gpsFixTimeLabel = document.getElementById('gps-time-label');

let gpsHardwareWarningDisplayed = false;
let magneticSwitchHardwareWarningDisplayed = false;

exports.isMagneticSwitchEnabled = () => {

    return magneticDelayCheckbox.checked;

};

exports.isTimeSettingFromGPSEnabled = () => {

    return gpsFixTimeCheckbox.checked;

};

exports.gpsFixesBeforeAfterSetting = () => {

    return gpsBeforeAfterSelect.value;

};

exports.getGpsFixTime = () => {

    return parseInt(gpsFixTimeSelect.value);

};

function updateGpsUI () {

    gpsBeforeAfterSelect.disabled = !gpsFixTimeCheckbox.checked;
    gpsBeforeAfterSelect.style.color = gpsFixTimeCheckbox.checked ? '' : 'grey';
    gpsBeforeAfterLabel.style.color = gpsFixTimeCheckbox.checked ? '' : 'grey';

    gpsFixTimeSelect.disabled = !gpsFixTimeCheckbox.checked;
    gpsFixTimeSelect.style.color = gpsFixTimeCheckbox.checked ? '' : 'grey';
    gpsFixTimeLabel.style.color = gpsFixTimeCheckbox.checked ? '' : 'grey';

}

exports.fillUI = (settings) => {

    magneticDelayCheckbox.checked = settings.magneticSwitchEnabled;

    gpsFixTimeCheckbox.checked = settings.timeSettingFromGPSEnabled;
    gpsBeforeAfterSelect.value = settings.acquireGpsFixBeforeAfter;

    const gpsFixTimeSelectValues = [...gpsFixTimeSelect.options].map(o => o.value);

    const gpsFixTimeString = settings.gpsFixTime.toString();

    /* Convert GPS fix time value to a string and check it against available values in dropdown */

    gpsFixTimeSelect.value = gpsFixTimeSelectValues.includes(gpsFixTimeString) ? gpsFixTimeString : '2';

    updateGpsUI();

};

exports.prepareUI = (changeFunction) => {

    gpsFixTimeCheckbox.addEventListener('change', changeFunction);
    gpsBeforeAfterSelect.addEventListener('change', changeFunction);
    gpsFixTimeSelect.addEventListener('change', changeFunction);

};

function displayAdditionalHardwareWarning (featureString) {

    dialog.showMessageBox({
        type: 'warning',
        buttons: ['OK'],
        title: 'Additional hardware required',
        message: 'Additional hardware is required to use the ' + featureString + ' feature. Do not use these settings if this hardware is not present.'
    });

}

function displayGpsHardwareWarning () {

    if (gpsHardwareWarningDisplayed) {

        return;

    }

    displayAdditionalHardwareWarning('GPS time setting');

    gpsHardwareWarningDisplayed = true;

}

exports.displayGpsHardwareWarning = displayGpsHardwareWarning;

function displayMagneticSwitchHardwareWarning () {

    if (magneticSwitchHardwareWarningDisplayed) {

        return;

    }

    displayAdditionalHardwareWarning('magnetic switch');

    magneticSwitchHardwareWarningDisplayed = true;

}

exports.displayMagneticSwitchHardwareWarning = displayMagneticSwitchHardwareWarning;

gpsFixTimeCheckbox.addEventListener('change', () => {

    if (gpsFixTimeCheckbox.checked) {

        displayGpsHardwareWarning();

    }

    updateGpsUI();

});

magneticDelayCheckbox.addEventListener('change', () => {

    if (magneticDelayCheckbox.checked) {

        displayMagneticSwitchHardwareWarning();

    }

});
