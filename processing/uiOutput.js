/****************************************************************************
 * uiOutput.js
 * openacousticdevices.info
 * June 2022
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const dialog = electron.remote.dialog;

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

var outputDir = '';

/* Update label to notify user if a custom output directtory is being used */

function updateOutputLabel (outputDir) {

    if (outputDir === '') {

        outputLabel.textContent = 'Writing WAV files to source folder.';

    } else {

        outputLabel.textContent = 'Writing WAV files to custom folder.';

    }

};

/* Add listener which handles enabling/disabling custom output directory UI */

outputCheckbox.addEventListener('change', () => {

    if (outputCheckbox.checked) {

        outputLabel.classList.remove('grey');
        outputButton.disabled = false;

    } else {

        outputLabel.classList.add('grey');
        outputButton.disabled = true;
        outputDir = '';
        updateOutputLabel(outputDir);

    }

});

/* Select a custom output directory. If Cancel is pressed, assume no custom direcotry is wantted */

outputButton.addEventListener('click', () => {

    const destinationName = dialog.showOpenDialogSync({
        title: 'Select Destination',
        nameFieldLabel: 'Destination',
        multiSelections: false,
        properties: ['openDirectory']
    });

    outputDir = (destinationName !== undefined) ? destinationName[0] : '';

    updateOutputLabel(outputDir);

});

exports.disableOutputCheckbox = () => {

    outputCheckbox.disabled = true;

};

exports.disableOutputButton = () => {

    outputButton.disabled = true;

};

exports.enableOutputCheckbox = () => {

    outputCheckbox.disabled = false;

};

exports.enableOutputButton = () => {

    outputButton.disabled = false;

};

exports.isChecked = () => {

    return outputCheckbox.checked;

};

exports.getOutputDir = () => {

    return outputDir;

};
