/****************************************************************************
 * uiCommons.js
 * openacousticdevices.info
 * February 2021
 *****************************************************************************/

/* Functions which control elements common to the expansion and split windows */

const electron = require('electron');
const dialog = electron.remote.dialog;

const path = require('path');
const fs = require('fs');

const nightMode = require('../nightMode.js');

const currentWindow = electron.remote.getCurrentWindow();

const fileButton = document.getElementById('file-button');

const prefixInput = document.getElementById('prefix-input');
const prefixCheckbox = document.getElementById('prefix-checkbox');
const prefixLabel = document.getElementById('prefix-label');

const outputLabel = document.getElementById('output-label');

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value);

}

exports.getSelectedRadioValue = getSelectedRadioValue;

/* Pause execution */

exports.sleep = (milliseconds) => {

    const date = Date.now();
    let currentDate = null;

    do {

        currentDate = Date.now();

    } while (currentDate - date < milliseconds);

};

electron.ipcRenderer.on('night-mode', (e, nm) => {

    if (nm !== undefined) {

        nightMode.setNightMode(nm);

    } else {

        nightMode.toggle();

    }

});

/* Update text on selection button to reflect selection mode (file or folder selection) */

exports.updateButtonText = () => {

    const selectionType = getSelectedRadioValue('selection-radio');

    if (selectionType === 0) {

        fileButton.innerText = 'Select Files';

    } else {

        fileButton.innerText = 'Select Folder';

    }

};

/* Open dialog and set files to be expanded */

exports.selectRecordings = (fileRegex) => {

    let folderContents, i, filePath, fileName, recordings;

    const selectionTypes = ['openFile', 'openDirectory'];
    const selectionType = getSelectedRadioValue('selection-radio');
    const properties = [selectionTypes[selectionType]];

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

            for (i = 0; i < selection.length; i++) {

                filePath = selection[i];
                fileName = path.basename(filePath);

                /* Check if wav files match a given regex and thus can be expanded/split */

                if (filePath.charAt(0) !== '.' && fileRegex.test(fileName.toUpperCase())) {

                    recordings.push(filePath);

                }

            }

        } else {

            folderContents = fs.readdirSync(selection[0]);

            for (i = 0; i < folderContents.length; i++) {

                filePath = folderContents[i];

                if (filePath.charAt(0) !== '.' && fileRegex.test(filePath.toUpperCase())) {

                    recordings.push(path.join(selection[0], filePath));

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

    var reg = /[^A-Za-z_0-9]{1}/g;

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

        prefixLabel.style.color = '';
        prefixInput.style.color = '';
        prefixInput.disabled = false;

    } else {

        prefixLabel.style.color = 'lightgray';
        prefixInput.style.color = 'lightgray';
        prefixInput.disabled = true;

    }

});

/* Update label to notify user if a custom output directtory is being used */

exports.updateOutputLabel = (outputDir) => {

    if (outputDir === '') {

        outputLabel.textContent = 'Writing WAV files to source folder.';

    } else {

        outputLabel.textContent = 'Writing WAV files to custom folder.';

    }

};
