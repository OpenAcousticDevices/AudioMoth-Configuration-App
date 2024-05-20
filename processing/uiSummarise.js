/****************************************************************************
 * uiSummarise.js
 * openacousticdevices.info
 * September 2023
 *****************************************************************************/

const electron = require('electron');
const {dialog, shell} = require('@electron/remote');

/* Get common functions to add night mode functionality */
require('./uiCommon.js');

const uiInput = require('./uiInput.js');

const audiomothUtils = require('audiomoth-utils');

const path = require('path');

const fileLabel = document.getElementById('file-label');
const fileButton = document.getElementById('file-button');

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

const summariseButton = document.getElementById('summarise-button');

let files = [];
let outputDir = '';
let sourceDir = '';
let selection = [];

let summarising = false;

/* Disable UI elements in main window while progress bar is open and downsample is in progress */

function disableUI () {

    fileButton.disabled = true;
    summariseButton.disabled = true;

    outputButton.disabled = true;

}

function enableUI () {

    fileButton.disabled = false;
    summariseButton.disabled = false;

    outputButton.disabled = false;

    summarising = false;

}

/* Update label to reflect new file/folder selection */

function updateInputDirectoryDisplay (directoryArray) {

    if (!directoryArray || directoryArray.length === 0) {

        fileLabel.innerHTML = 'No folder selected.';
        summariseButton.disabled = true;

    } else {

        fileLabel.innerHTML = 'Found ';
        fileLabel.innerHTML += directoryArray.length + ' file';
        fileLabel.innerHTML += (directoryArray.length === 1 ? '' : 's');
        fileLabel.innerHTML += '.';
        summariseButton.disabled = false;

    }

}

/* Summary file output */

/* Update label to notify user if a custom output directtory is being used */

function updateOutputLabel () {

    if (outputDir === '' || !outputCheckbox.checked) {

        outputLabel.textContent = 'Writing summary file to source folder.';

    } else {

        outputLabel.textContent = 'Writing summary file to destination folder.';

    }

};

/* Add listener which handles enabling/disabling custom output directory UI */

outputCheckbox.addEventListener('change', () => {

    updateOutputLabel();

    outputButton.disabled = !outputCheckbox.checked;

});

outputButton.addEventListener('click', () => {

    const destinationName = dialog.showOpenDialogSync({
        title: 'Select Destination',
        nameFieldLabel: 'Destination',
        multiSelections: false,
        properties: ['openDirectory']
    });

    outputDir = (destinationName !== undefined) ? destinationName[0] : '';

    updateOutputLabel();

});

/* Select/process file(s) buttons */

fileButton.addEventListener('click', () => {

    const response = uiInput.selectAllFilesInFolder();

    if (response) {

        selection = response.selection;

        files = response.files;

        sourceDir = response.folder;

    }

    updateInputDirectoryDisplay(files);

});

/* Summarise functionality */

function summariseFiles () {

    if (!files) {

        return;

    }

    let successCount = 0;

    audiomothUtils.summariser.initialise();

    for (let i = 0; i < files.length; i++) {

        /* If progress bar is closed, the summarise task is considered cancelled. This will contact the main thread and ask if that has happened */

        const cancelled = electron.ipcRenderer.sendSync('poll-summarise-cancelled');

        if (cancelled) {

            console.log('Summary cancelled.');
            enableUI();
            return;

        }

        /* Let the main thread know what value to set the progress bar to */

        electron.ipcRenderer.send('set-summarise-bar-progress', i, 0);

        console.log('Summarising:', files[i]);
        console.log('-');

        const summariseSuccess = audiomothUtils.summariser.summarise(sourceDir, files[i], (progress) => {

            electron.ipcRenderer.send('set-summarise-bar-progress', i, progress);
            electron.ipcRenderer.send('set-summarise-bar-file', i, path.basename(files[i]));

        });

        if (summariseSuccess) {

            successCount++;

        }

    }

    /* Attempt to write summary file */

    /* If no output path given, use the containing directory of the input files */

    const outputPath = outputCheckbox.checked && outputDir !== '' ? outputDir : sourceDir;

    const finaliseResult = audiomothUtils.summariser.finalise(outputPath);

    /* Notify main thread that summarise is complete so progress bar is closed */

    electron.ipcRenderer.send('set-summarise-bar-completed', successCount, finaliseResult);

    /* Show summarise file location */

    try {

        shell.showItemInFolder(path.join(outputPath, 'SUMMARY.CSV'));

    } catch (error) {

        console.error('Failed to show summary file in file explorer');

    }

}

summariseButton.addEventListener('click', () => {

    if (summarising) {

        return;

    }

    const response = uiInput.updateFilesInFolder(selection);

    if (response) {

        files = response.files;
        sourceDir = response.folder;

        updateInputDirectoryDisplay(files);

        summarising = true;
        disableUI();

        electron.ipcRenderer.send('start-summarise-bar', files.length);
        setTimeout(summariseFiles, 2000);

    } else {

        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Folder Not Found',
            message: 'Selected folder no longer exists. Select a new location and try again.'
        });

        files = [];
        sourceDir = '';
        selection = [];

        updateInputDirectoryDisplay(files);

    }

});

/* When the progress bar is complete and the summary window at the end has been displayed for a fixed amount of time, it will close and this re-enables the UI */

electron.ipcRenderer.on('summarise-summary-closed', enableUI);
