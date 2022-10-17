/****************************************************************************
 * uiOutput.js
 * openacousticdevices.info
 * June 2022
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const dialog = electron.remote.dialog;
const currentWindow = electron.remote.getCurrentWindow();

const path = require('path');
const fs = require('fs');

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

const subdirectoriesLabel = document.getElementById('subdirectories-label');
const subdirectoriesCheckbox = document.getElementById('subdirectories-checkbox');

var outputDir = '';

const prefixInput = document.getElementById('prefix-input');
const prefixCheckbox = document.getElementById('prefix-checkbox');
const prefixLabel = document.getElementById('prefix-label');

const selectionRadios = document.getElementsByName('selection-radio');

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value);

}

/* Update label to notify user if a custom output directtory is being used */

function updateOutputLabel () {

    if (outputDir === '' || !outputCheckbox.checked) {

        outputLabel.textContent = 'Writing WAV files to source folder.';

    } else {

        outputLabel.textContent = 'Writing WAV files to destination folder.';

    }

};

function updateSubdirectoriesCheckbox () {

    const selectionType = getSelectedRadioValue('selection-radio');

    if (outputCheckbox.checked && outputDir !== '' && selectionType === 1) {

        subdirectoriesCheckbox.disabled = false;
        subdirectoriesLabel.classList.remove('grey');

    } else {

        subdirectoriesCheckbox.disabled = true;
        subdirectoriesLabel.classList.add('grey');

    }

}

/* Add listener which handles enabling/disabling custom output directory UI */

outputCheckbox.addEventListener('change', () => {

    updateOutputLabel();

    updateSubdirectoriesCheckbox();

    outputButton.disabled = !outputCheckbox.checked;

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

    updateOutputLabel();

    updateSubdirectoriesCheckbox();

});

/* Open dialog and set files to be expanded */

exports.selectRecordings = (fileRegex) => {

    let folderContents, filePath, fileName, recordings;

    const selectionTypes = ['openFile', 'openDirectory'];
    const selectionType = getSelectedRadioValue('selection-radio');
    const properties = [selectionTypes[selectionType], 'multiSelections'];

    /* If files are being selected, allow users to selectt more than one item. Only a single folder can be selected */

    if (selectionType === 0) {

        properties.push('multiSelections');

    }

    /* If files are being selected, limit selection to .wav files */

    const filters = (selectionType === 0) ? [{name: 'wav', extensions: ['wav']}] : [];

    const selection = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select recording file or folder containing recordings',
        nameFieldLabel: 'Recordings',
        properties: properties,
        filters: filters
    });

    if (selection) {

        recordings = [];

        if (selectionType === 0) {

            for (let i = 0; i < selection.length; i++) {

                filePath = selection[i];
                fileName = path.basename(filePath);

                /* Check if wav files match a given regex and thus can be expanded/split */

                if (filePath.charAt(0) !== '.' && fileRegex.test(fileName.toUpperCase())) {

                    recordings.push(filePath);

                }

            }

        } else {

            for (let i = 0; i < selection.length; i++) {

                folderContents = fs.readdirSync(selection[i]);

                for (let j = 0; j < folderContents.length; j++) {

                    filePath = folderContents[j];

                    if (filePath.charAt(0) !== '.' && fileRegex.test(filePath.toUpperCase())) {

                        recordings.push(path.join(selection[i], filePath));

                    }

                }

            }

        }

        return recordings;

    }

};

/* Remove all characters which aren't A-Z, a-z, 0-9, and _ */

prefixInput.addEventListener('keydown', (e) => {

    if (prefixInput.disabled) {

        e.preventDefault();
        return;

    }

    var reg = /[^A-Za-z-_0-9]{1}/g;

    if (reg.test(e.key)) {

        e.preventDefault();

    }

});

prefixInput.addEventListener('paste', (e) => {

    e.stopPropagation();
    e.preventDefault();

    if (prefixInput.disabled) {

        return;

    }

    /* Read text from clipboard */

    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');

    /* Perform paste, but remove all unsupported characters */

    prefixInput.value += pastedData.replace(/[^A-Za-z_0-9]{1}/g, '');

    /* Limit max number of characters */

    prefixInput.value = prefixInput.value.substring(0, prefixInput.maxLength);

});

/* Add listener to handle enabling/disabling prefix UI */

prefixCheckbox.addEventListener('change', () => {

    if (prefixCheckbox.checked) {

        prefixLabel.classList.remove('grey');
        prefixInput.classList.remove('grey');
        prefixInput.disabled = false;

    } else {

        prefixLabel.classList.add('grey');
        prefixInput.classList.add('grey');
        prefixInput.disabled = true;

    }

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

exports.isCustomDestinationEnabled = () => {

    return outputCheckbox.checked;

};

exports.getOutputDir = () => {

    return outputDir;

};

exports.isCreateSubdirectoriesEnabled = () => {

    return subdirectoriesCheckbox.checked;

};

selectionRadios[0].addEventListener('change', updateSubdirectoriesCheckbox);
selectionRadios[1].addEventListener('change', updateSubdirectoriesCheckbox);
