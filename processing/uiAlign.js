/****************************************************************************
 * uiAlign.js
 * openacousticdevices.info
 * October 2024
 *****************************************************************************/

const electron = require('electron');
const {dialog, getCurrentWindow} = require('@electron/remote');
const currentWindow = getCurrentWindow();

/* Get common functions to add night mode functionality */
const uiCommon = require('./uiCommon.js');

const audiomothUtils = require('audiomoth-utils');

const path = require('path');
const fs = require('fs');

const selectionRadios = document.getElementsByName('selection-radio');

const fileLabel = document.getElementById('file-label');
const fileButton = document.getElementById('file-button');

const betweenFixesCheckbox = document.getElementById('between-fixes-checkbox');

const prefixLabel = document.getElementById('prefix-label');
const prefixCheckbox = document.getElementById('prefix-checkbox');
const prefixInput = document.getElementById('prefix-input');

const subdirectoriesLabel = document.getElementById('subdirectories-label');
const subdirectoriesCheckbox = document.getElementById('subdirectories-checkbox');

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

const alignButton = document.getElementById('align-button');

let selection = [];
let outputDir = '';

let aligning = false;

let synchronisationDict = [];
let fileCount = 0;

/* Reset UI to state it should be in when first loaded */

function resetUI () {

    selection = [];
    synchronisationDict = [];
    fileCount = 0;

    updateInputDirectoryDisplay();

    alignButton.disabled = true;

    uiCommon.updateButtonText();

    updateSubdirectoriesCheckbox();

}

/* Disable UI elements in main window while progress bar is open and downsample is in progress */

function disableUI () {

    fileButton.disabled = true;
    alignButton.disabled = true;

    outputCheckbox.disabled = true;
    outputButton.disabled = true;

    betweenFixesCheckbox.disabled = true;

    prefixCheckbox.disabled = true;
    prefixInput.disabled = true;

}

/* Re-enable UI after synchronisation is complete */

function enableUI () {

    fileButton.disabled = false;
    alignButton.disabled = false;

    outputCheckbox.disabled = false;

    if (outputCheckbox.checked) {

        outputButton.disabled = false;

    }

    betweenFixesCheckbox.disabled = false;

    prefixCheckbox.disabled = false;

    if (prefixCheckbox.checked) {

        prefixInput.disabled = false;

    }

    aligning = false;

}

/* Enable "Create subfolders in destination" option only if in folder mode and a custom output destination has been selected */

function updateSubdirectoriesCheckbox () {

    const selectionType = uiCommon.getSelectedRadioValue('selection-radio');

    if (outputCheckbox.checked && outputDir !== '' && selectionType === 1) {

        subdirectoriesCheckbox.disabled = false;
        subdirectoriesLabel.classList.remove('grey');

    } else {

        subdirectoriesCheckbox.disabled = true;
        subdirectoriesLabel.classList.add('grey');

    }

}

/* Update prefix UI when checkbox changes */

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

/* Update label to reflect new file/folder selection */

function updateInputDirectoryDisplay () {

    if (fileCount === 0) {

        fileLabel.innerHTML = 'No AudioMoth WAV files selected.';
        alignButton.disabled = true;

    } else {

        fileLabel.innerHTML = 'Found ';
        fileLabel.innerHTML += fileCount + ' AudioMoth WAV file';
        fileLabel.innerHTML += (fileCount === 1 ? '' : 's');
        fileLabel.innerHTML += '.';
        alignButton.disabled = false;

    }

}

/* Update label to notify user if a custom output directtory is being used */

function updateOutputLabel () {

    if (outputDir === '' || !outputCheckbox.checked) {

        outputLabel.textContent = 'Writing WAV files to source folder.';

    } else {

        outputLabel.textContent = 'Writing WAV files to destination folder.';

    }

}

/* Search a given directory for a text file called "GPS.TXT". Return null if not found */

function searchDirectoryForGpsTxt (folderPath) {

    console.log('Searching for GPS.TXT');

    try {

        const files = fs.readdirSync(folderPath);

        const gpsFile = files.find(file => file.toLowerCase() === 'gps.txt');

        if (gpsFile) {

            return path.join(folderPath, gpsFile);

        } else {

            return null;

        }

    } catch (err) {

        console.error('Error reading the directory:', err);
        return null;

    }

}

/* Search a given directory for .WAV files and return an array of files */

function searchDirectoryForWavFiles (folderPath) {

    console.log('Searching for WAV files');

    try {

        const regex = audiomothUtils.getFilenameRegex(audiomothUtils.SYNC);

        const files = fs.readdirSync(folderPath);

        const matchingFiles = files.filter(file => regex.test(path.basename(file)));

        return matchingFiles.map(file => path.join(folderPath, file));

    } catch (err) {

        console.error('Error reading the directory:', err);
        return [];

    }

}

/* Does the given directory follow the naming convention of a daily recording folder? */

function isDailyFolder (folderPath) {

    const dateRegex = /\b\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/;

    const match = folderPath.match(dateRegex);

    return match !== null;

}

/* Get a list of all subfolders of a given folder */

function getSubfolders (folderPath) {

    console.log('Searching for subfolders');

    try {

        const items = fs.readdirSync(folderPath);

        const subfolders = items.filter(item => {

            const itemPath = path.join(folderPath, item);
            return fs.statSync(itemPath).isDirectory();

        });

        return subfolders.map(subfolder => path.join(folderPath, subfolder));

    } catch (err) {

        console.error('Error reading the directory:', err);
        return [];

    }

}

/**
 * Add wav file paths to dictionary, using GPS.TXT path as an index
 * @param {string} gpsTxtPath Path to GPS.TXT file
 * @param {string[]} wavFiles Array of paths to WAV files to be added to the synchronisation dict
 * @param {boolean} isGpsTxtInParent Is the GPS.TXT file in the parent folder of the WAV files
 */
function addToDict (gpsTxtPath, wavFiles, isGpsTxtInParent) {

    for (let i = 0; i < synchronisationDict.length; i++) {

        if (synchronisationDict[i].gpsTxtPath === gpsTxtPath) {

            synchronisationDict[i].wavFiles = synchronisationDict[i].wavFiles.concat(wavFiles);
            return;

        }

    }

    synchronisationDict.push({
        gpsTxtPath,
        wavFiles,
        isGpsTxtInParent
    });

}

/* Search for a GPS.TXT file, get a list of all wav files in the current directory and its subfolders then add them the dictionary */

function populateFromFolder (folderPath) {

    let gpsTxtPath;

    let isGpsTxtInParent = false;

    // If folder name matches pattern of daily folder, check up one level for GPS.TXT

    if (isDailyFolder(folderPath)) {

        console.log('Folder is a daily folder, checking parent for GPS.TXT');

        const parentPath = path.dirname(folderPath);
        gpsTxtPath = searchDirectoryForGpsTxt(parentPath);

        isGpsTxtInParent = gpsTxtPath !== null;

    }

    // If it doesn't match the pattern or GPS.TXT wasn't found in parent, search current folder

    gpsTxtPath = gpsTxtPath || searchDirectoryForGpsTxt(folderPath);

    // Find WAV files

    let wavFiles = [];

    // Search for WAV files in this directory and add to dictionary entry for this GPS.TXT path

    const wavFilesInCurrentDirectory = searchDirectoryForWavFiles(folderPath);

    wavFiles = wavFiles.concat(wavFilesInCurrentDirectory);

    // Get list of subfolders

    const subfolders = getSubfolders(folderPath);

    // Look for WAV files in subfolders if they have the daily folder format

    for (let i = 0; i < subfolders.length; i++) {

        if (isDailyFolder(subfolders[i])) {

            const wavFilesInSubdirectory = searchDirectoryForWavFiles(subfolders[i]);

            wavFiles = wavFiles.concat(wavFilesInSubdirectory);

        }

    }

    // Only display error if files are found but GPS.TXT isn't

    if (wavFiles.length > 0) {

        if (gpsTxtPath) {

            console.log('Found GPS.TXT', gpsTxtPath);

            fileCount += wavFiles.length;

            // Add GPS.TXT and array of wav files to dictionary

            addToDict(gpsTxtPath, wavFiles, isGpsTxtInParent);

        } else {

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'GPS.TXT Not Found',
                message: 'The GPS.TXT file required to synchronise files could not be found.'
            });

        }

    }

}

/**
 * @returns Is the selection mode on file mode or folder mode
 */
function isFileModeEnabled () {

    const selectionType = uiCommon.getSelectedRadioValue('selection-radio');
    return selectionType === 0;

}

/**
 * Populate the synchronisation dictionary with arrays of WAV files and their associated GPS.TXT files
 * @param {string} filePickerResult Path of file picker selection
 */
function populateDict (filePickerResult) {

    // Clear dictionary and reset file count

    synchronisationDict = [];
    fileCount = 0;

    if (isFileModeEnabled()) {

        let gpsTxtPath;

        const currentFolder = path.dirname(filePickerResult[0]);

        let isGpsTxtInParent = false;

        // If daily folder, check parent for GPS.TXT

        if (isDailyFolder(currentFolder)) {

            console.log('Folder is a daily folder, checking parent for GPS.TXT');

            const parentFolder = path.dirname(currentFolder);

            gpsTxtPath = searchDirectoryForGpsTxt(parentFolder);

            isGpsTxtInParent = gpsTxtPath !== null;

        }

        // Check if current folder contains GPS.TXT

        gpsTxtPath = gpsTxtPath || searchDirectoryForGpsTxt(currentFolder);

        if (gpsTxtPath) {

            const regex = audiomothUtils.getFilenameRegex(audiomothUtils.SYNC);

            const wavFiles = filePickerResult.filter(filePath => regex.test(path.basename(filePath)));

            if (wavFiles.length > 0) {

                fileCount += wavFiles.length;

                addToDict(gpsTxtPath, wavFiles, isGpsTxtInParent);

            }

        } else {

            dialog.showMessageBoxSync({
                type: 'error',
                title: 'GPS.TXT Not Found',
                message: 'The GPS.TXT file required to synchronise files could not be found.'
            });

        }

    } else {

        for (let i = 0; i < filePickerResult.length; i++) {

            populateFromFolder(filePickerResult[i]);

        }

    }

    console.log('Synchronisation dictionary:');
    console.log(synchronisationDict);

    updateInputDirectoryDisplay();

}

/* Select/process file(s) buttons */

fileButton.addEventListener('click', () => {

    const selectionTypes = ['openFile', 'openDirectory'];
    const selectionType = uiCommon.getSelectedRadioValue('selection-radio');
    const properties = [selectionTypes[selectionType], 'multiSelections'];

    /* If files are being selected, limit selection to .wav files */

    const filters = isFileModeEnabled() ? [{name: 'wav', extensions: ['wav']}] : [];

    const openPath = selection.length > 0 ? path.dirname(selection[0]) : '';

    const filePickerResult = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select recording file or folder containing recordings',
        nameFieldLabel: 'Recordings',
        properties,
        filters,
        defaultPath: openPath
    });

    if (filePickerResult) {

        selection = filePickerResult;

        populateDict(filePickerResult);

    }

});

/* Synchronisation functionality */

function alignFiles () {

    if (synchronisationDict.length === 0) {

        return;

    }

    aligning = true;
    disableUI();

    let successCount = 0;
    let totalErrorCount = 0;

    const prefix = (prefixCheckbox.checked && prefixInput.value !== '') ? prefixInput.value : null;

    let fileIndex = 0;

    for (let i = 0; i < synchronisationDict.length; i++) {

        let errorCount = 0;
        let errorText = '';

        const gpsTxtPath = synchronisationDict[i].gpsTxtPath;

        /* Work out file path for GPS.CSV and ERROR.TXT */

        let resultFilePath = path.parse(gpsTxtPath).dir;

        if (outputCheckbox.checked && outputDir !== '') {

            if (subdirectoriesCheckbox.checked && !isFileModeEnabled() && !synchronisationDict[i].isGpsTxtInParent) {

                const dirnames = path.dirname(gpsTxtPath).replace(/\\/g, '/').split('/');

                const folderName = dirnames[dirnames.length - 1];

                resultFilePath = path.join(outputDir, folderName);

            } else {

                resultFilePath = outputDir;

            }

        }

        /* Initialise sychronisation */

        const initialiseResult = audiomothUtils.aligner.initialise(gpsTxtPath);

        if (!initialiseResult.success) {

            console.log('Failed to initialise', gpsTxtPath, '. Error:', initialiseResult.error);

            electron.ipcRenderer.send('set-align-bar-initialise-error', initialiseResult.error);

            errorText += gpsTxtPath + ' - ' + initialiseResult.error + '\r\n';
            errorCount++;
            totalErrorCount++;

            uiCommon.sleep(3000);

        } else {

            for (let j = 0; j < synchronisationDict[i].wavFiles.length; j++) {

                /* If progress bar is closed, the align task is considered cancelled. This will contact the main thread and ask if that has happened */

                const cancelled = electron.ipcRenderer.sendSync('poll-align-cancelled');

                if (cancelled) {

                    console.log('Align cancelled.');
                    enableUI();
                    return;

                }

                const wavFilePath = synchronisationDict[i].wavFiles[j];

                let outputPath = null;

                if (outputCheckbox.checked) {

                    outputPath = outputDir;

                    /* If in folder mode and subdirectory creation is enabled, create folders in output location */

                    if (subdirectoriesCheckbox.checked && !isFileModeEnabled()) {

                        const dirnames = path.dirname(wavFilePath).replace(/\\/g, '/').split('/');

                        const folderName = dirnames[dirnames.length - 1];

                        outputPath = path.join(outputPath, folderName);

                        if (!fs.existsSync(outputPath)) {

                            fs.mkdirSync(outputPath);

                        }

                    }

                }

                /* Let the main thread know what value to set the progress bar to */

                electron.ipcRenderer.send('set-align-bar-progress', fileIndex, 0);

                console.log('Aligning:', wavFilePath);

                const alignResult = audiomothUtils.aligner.align(wavFilePath, outputPath, prefix, betweenFixesCheckbox.checked, (progress) => {

                    electron.ipcRenderer.send('set-align-bar-progress', fileIndex, progress);
                    electron.ipcRenderer.send('set-align-bar-file', fileIndex, path.basename(wavFilePath));

                });

                if (alignResult.success) {

                    successCount++;

                } else {

                    errorText += wavFilePath + ' - ' + alignResult.error + '\r\n';
                    errorCount++;
                    totalErrorCount++;

                }

                fileIndex++;

            }

            console.log('Creating GPX.CSV at:', resultFilePath);

            const finaliseResult = audiomothUtils.aligner.finalise(resultFilePath);

            if (finaliseResult.success) {

                console.log('Successfully wrote GPS.CSV');

            } else {

                console.error('Failed to write GPS.CSV');
                console.error(finaliseResult.error);

                errorText += resultFilePath + ' - Failed to write GPS.CSV.\r\n';
                errorCount++;
                totalErrorCount++;

            }

        }

        /* Write ERROR.TXT */

        if (errorCount > 0) {

            /* Create folder if it doesn't exist */

            if (!fs.existsSync(resultFilePath)) {

                fs.mkdirSync(resultFilePath);

            }

            const errorFilePath = path.join(resultFilePath, 'ERRORS.TXT');
            const errorFileStream = fs.createWriteStream(errorFilePath, {flags: 'a'});

            errorFileStream.write('-- Synchronise --\r\n');

            try {

                errorFileStream.write(errorText);

                console.log('Error summary written to ' + errorFilePath);

            } catch (err) {

                console.error(err);
                return;

            }

        }

    }

    /* Notify user process is complete */

    electron.ipcRenderer.send('set-align-bar-completed', successCount, totalErrorCount);

}

/* UI listeners */

outputButton.addEventListener('click', () => {

    const destinationName = dialog.showOpenDialogSync({
        title: 'Select Destination',
        nameFieldLabel: 'Destination',
        multiSelections: false,
        properties: ['openDirectory'],
        defaultPath: outputDir
    });

    if (destinationName !== undefined) {

        outputDir = destinationName[0];

    }

    updateOutputLabel();

    updateSubdirectoriesCheckbox();

});

/* Add listener which handles enabling/disabling custom output directory UI */

outputCheckbox.addEventListener('change', () => {

    updateOutputLabel();

    updateSubdirectoriesCheckbox();

    outputButton.disabled = !outputCheckbox.checked;

});

alignButton.addEventListener('click', () => {

    if (aligning) {

        return;

    }

    /* Files or folders could have been deleted since selection was last made, so check again */

    populateDict(selection);

    if (fileCount === 0) {

        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Files Not Found',
            message: 'Selected file(s) no longer exist. Select a new location and try again.'
        });

        fileCount = 0;
        synchronisationDict = [];
        selection = [];

        updateInputDirectoryDisplay();

        return;

    }

    updateInputDirectoryDisplay();

    aligning = true;
    disableUI();

    electron.ipcRenderer.send('start-align-bar', fileCount);
    setTimeout(alignFiles, 2000);

});

selectionRadios[0].addEventListener('change', resetUI);
selectionRadios[1].addEventListener('change', resetUI);

/* When the progress bar is complete and the align window at the end has been displayed for a fixed amount of time, it will close and this re-enables the UI */

electron.ipcRenderer.on('align-summary-closed', enableUI);
