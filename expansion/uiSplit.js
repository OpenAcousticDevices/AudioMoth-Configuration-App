/****************************************************************************
 * uiSplit.js
 * openacousticdevices.info
 * February 2021
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const dialog = electron.remote.dialog;

/* Get functions which control elements common to the expansion and split windows */
const ui = require('./uiCommon.js');

const path = require('path');
const fs = require('fs');

const audiomothUtils = require('audiomoth-utils');

var currentWindow = electron.remote.getCurrentWindow();

const MAX_LENGTHS = [5, 10, 15, 30, 60, 300, 600, 3600];

const FILE_REGEX = /^\d\d\d\d\d\d\d\d_\d\d\d\d\d\d.WAV$/;

const maxLengthRadios = document.getElementsByName('max-length-radio');

const selectionRadios = document.getElementsByName('selection-radio');

const prefixCheckbox = document.getElementById('prefix-checkbox');
const prefixInput = document.getElementById('prefix-input');

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

var outputDir = '';

const fileLabel = document.getElementById('file-label');
const fileButton = document.getElementById('file-button');
const splitButton = document.getElementById('split-button');

var files = [];
var splitting = false;

/* Disable UI elements in main window while progress bar is open and split is in progress */

function disableUI () {

    fileButton.disabled = true;
    splitButton.disabled = true;
    selectionRadios[0].disabled = true;
    selectionRadios[1].disabled = true;

    for (let i = 0; i < maxLengthRadios.length; i++) {

        maxLengthRadios[i].disabled = true;

    }

    outputCheckbox.disabled = true;
    outputButton.disabled = true;

    prefixCheckbox.disabled = true;
    prefixInput.disabled = true;

}

function enableUI () {

    fileButton.disabled = false;
    splitButton.disabled = false;
    selectionRadios[0].disabled = false;
    selectionRadios[1].disabled = false;

    for (let i = 0; i < maxLengthRadios.length; i++) {

        maxLengthRadios[i].disabled = false;

    }

    outputCheckbox.disabled = false;
    outputButton.disabled = false;

    prefixCheckbox.disabled = false;

    if (prefixCheckbox.checked) {

        prefixInput.disabled = false;

    }

    splitting = false;

}

/* Split selected files */

function splitFiles () {

    if (!files) {

        return;

    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const errorFiles = [];

    let errorFilePath;

    for (let i = 0; i < files.length; i++) {

        /* If progress bar is closed, the split task is considered cancelled. This will contact the main thread and ask if that has happened */

        const cancelled = electron.ipcRenderer.sendSync('poll-split-cancelled');

        if (cancelled) {

            console.log('Split cancelled.');
            enableUI();
            return;

        }

        /* Let the main thread know what value to set the progress bar to */

        electron.ipcRenderer.send('set-split-bar-progress', i, 0, path.basename(files[i]));

        const maxLength = MAX_LENGTHS[ui.getSelectedRadioValue('max-length-radio')];

        console.log('Splitting:', files[i]);
        console.log('Maximum file length:', maxLength);

        console.log('-');

        /* Check if the optional prefix/output directory setttings are being used. If left as null, splitter will put file(s) in the same directory as the input with no prefix */

        const outputPath = outputCheckbox.checked ? outputDir : null;
        const prefix = (prefixCheckbox.checked && prefixInput.value !== '') ? prefixInput.value : null;

        const response = audiomothUtils.split(files[i], outputPath, prefix, maxLength, (progress) => {

            electron.ipcRenderer.send('set-split-bar-progress', i, progress, path.basename(files[i]));

        });

        if (response.success) {

            successCount++;

        } else {

            /* Add error to log file */

            errorCount++;
            errors.push(response.error);
            errorFiles.push(files[i]);

            electron.ipcRenderer.send('set-split-bar-error', path.basename(files[i]));

            if (errorCount === 1) {

                const errorFileLocation = outputCheckbox.checked ? outputDir : path.dirname(errorFiles[0]);

                errorFilePath = path.join(errorFileLocation, 'ERRORS.TXT');

            }

            let fileContent = '';

            for (let j = 0; j < errorCount; j++) {

                fileContent += path.basename(errorFiles[j]) + ' - ' + errors[j] + '\n';

            }

            try {

                fs.writeFileSync(errorFilePath, fileContent);

                console.log('Error summary written to ' + errorFilePath);

            } catch (err) {

                console.error(err);
                electron.ipcRenderer.send('set-split-bar-completed', successCount, errorCount, true);
                return;

            }

            ui.sleep(3000);

        }

    }

    /* Notify main thread that split is complete so progress bar is closed */

    electron.ipcRenderer.send('set-split-bar-completed', successCount, errorCount, false);

}

/* When the progress bar is complete and the summary window at the end has been displayed for a fixed amount of ttime, it will close and this re-enables the UI */

electron.ipcRenderer.on('split-summary-closed', enableUI);

/* Update label to reflect new file/folder selection */

function updateInputDirectoryDisplay (directoryArray) {

    if (directoryArray.length === 0 || !directoryArray) {

        fileLabel.innerHTML = 'No AudioMoth WAV files selected.';
        splitButton.disabled = true;

    } else {

        fileLabel.innerHTML = 'Found ';
        fileLabel.innerHTML += directoryArray.length + ' AudioMoth WAV file';
        fileLabel.innerHTML += (directoryArray.length === 1 ? '' : 's');
        fileLabel.innerHTML += '.';
        splitButton.disabled = false;

    }

}

/* Reset UI back to default state, clearing the selected files */

function resetUI () {

    files = [];

    fileLabel.innerHTML = 'No AudioMoth WAV files selected.';

    splitButton.disabled = true;

    ui.updateButtonText();

}

/* Add listener which handles enabling/disabling custom output directory UI */

outputCheckbox.addEventListener('change', () => {

    if (outputCheckbox.checked) {

        outputLabel.style.color = '';
        outputButton.disabled = false;

    } else {

        outputLabel.style.color = 'lightgray';
        outputButton.disabled = true;
        outputDir = '';
        ui.updateOutputLabel(outputDir);

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

    ui.updateOutputLabel(outputDir);

});

/* Whenever tthe file/folder radio button changes, reset the UI */

selectionRadios[0].addEventListener('change', resetUI);
selectionRadios[1].addEventListener('change', resetUI);

/* Select/process file(s) buttons */

fileButton.addEventListener('click', () => {

    files = ui.selectRecordings(FILE_REGEX);

    updateInputDirectoryDisplay(files);

    ui.updateButtonText();

});

splitButton.addEventListener('click', () => {

    if (splitting) {

        return;

    }

    if ((!prefixCheckbox.checked || prefixInput.value === '') && (!outputCheckbox.checked || outputDir === '')) {

        dialog.showMessageBox(currentWindow, {
            type: 'error',
            title: 'Cannot split with current settings',
            message: 'Without a prefix or custom destination, splitting will overwrite the original file. Set one of these values to continue.'
        });

        return;

    }

    splitting = true;
    disableUI();

    electron.ipcRenderer.send('start-split-bar', files.length);
    setTimeout(splitFiles, 2000);

});
