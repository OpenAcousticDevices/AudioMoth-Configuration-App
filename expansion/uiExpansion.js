/****************************************************************************
 * uiExpansion.js
 * openacousticdevices.info
 * April 2020
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const dialog = electron.remote.dialog;

const path = require('path');
const fs = require('fs');

const expander = require('../decompress.js');

var currentWindow = electron.remote.getCurrentWindow();

var selectionRadios = document.getElementsByName('selection-radio');
var fileLabel = document.getElementById('file-label');
var fileButton = document.getElementById('file-button');
var expandButton = document.getElementById('expand-button');

var files = [];
var expanding = false;

function disableUI () {

    fileButton.disabled = true;
    expandButton.disabled = true;
    selectionRadios[0].disabled = true;
    selectionRadios[1].disabled = true;

}

function enableUI () {

    fileButton.disabled = false;
    expandButton.disabled = false;
    selectionRadios[0].disabled = false;
    selectionRadios[1].disabled = false;
    expanding = false;

}

function sleep (milliseconds) {

    var date = Date.now();
    var currentDate = null;

    do {

        currentDate = Date.now();

    } while (currentDate - date < milliseconds);

}

function expandFiles () {

    var i, successCount, errorCount, errors, errorFiles, cancelled, response, filePath, fileContent, j;

    if (!files) {

        return;

    }

    successCount = 0;
    errorCount = 0;
    errors = [];
    errorFiles = [];

    for (i = 0; i < files.length; i++) {

        cancelled = electron.ipcRenderer.sendSync('poll-cancelled');

        if (cancelled) {

            console.log('Expansion cancelled.');
            enableUI();
            return;

        }

        console.log('Expanding: ' + files[i]);
        electron.ipcRenderer.send('set-bar-progress', i, path.basename(files[i]));

        response = expander.decompress(files[i]);

        if (response.success) {

            successCount++;

        } else {

            errorCount++;
            errors.push(response.error);
            errorFiles.push(files[i]);

            electron.ipcRenderer.send('set-bar-error', path.basename(files[i]));

            sleep(3000);

        }

    }

    electron.ipcRenderer.send('set-bar-completed', successCount, errorCount);

    if (errorCount > 0) {

        filePath = path.join(path.dirname(errorFiles[0]), 'ERRORS.TXT');

        fileContent = '';

        for (j = 0; j < errorCount; j++) {

            fileContent += path.basename(errorFiles[j]) + ' - ' + errors[j] + '\n';

        }

        fs.writeFile(filePath, fileContent, function (err) {

            if (err) {

                console.error(err);
                return;

            }

            console.log('Error summary written to ' + filePath);

        });

    }

}

electron.ipcRenderer.on('summary-closed', enableUI);

function updateFirmwareDirectoryDisplay (directoryArray) {

    if (directoryArray.length === 0) {

        fileLabel.innerHTML = 'No T.WAV files found.';
        expandButton.disabled = true;

    } else {

        fileLabel.innerHTML = 'Found ';
        fileLabel.innerHTML += directoryArray.length + ' T.WAV file';
        fileLabel.innerHTML += (directoryArray.length === 1 ? '' : 's');
        fileLabel.innerHTML += '.';
        expandButton.disabled = false;

    }

}

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value);

}

function updateButtonText () {

    var selectionType = getSelectedRadioValue('selection-radio');

    if (selectionType === 0) {

        fileButton.innerText = 'Select Files';

    } else {

        fileButton.innerText = 'Select Folder';

    }

}

function selectRecordings () {

    var selectionTypes, properties, filters, selectionType, selection, folderContents, i, fileName, recordings;

    selectionTypes = ['openFile', 'openDirectory'];

    selectionType = getSelectedRadioValue('selection-radio');

    properties = [selectionTypes[selectionType]];

    if (selectionType === 0) {

        properties.push('multiSelections');

    }

    filters = (selectionType === 0) ? [{name: 'wav', extensions: ['wav']}] : [];

    selection = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select recording file or folder containing recordings',
        nameFieldLabel: 'Recordings',
        properties: properties,
        filters: filters
    });

    if (selection) {

        recordings = [];

        if (selectionType === 0) {

            for (i = 0; i < selection.length; i++) {

                fileName = selection[i];

                if (fileName.charAt(0) !== '.' && fileName.toLowerCase().includes('t.wav')) {

                    recordings.push(fileName);

                }

            }

        } else {

            folderContents = fs.readdirSync(selection[0]);

            for (i = 0; i < folderContents.length; i++) {

                fileName = folderContents[i];

                if (fileName.charAt(0) !== '.' && fileName.toLowerCase().includes('t.wav')) {

                    recordings.push(path.join(selection[0], fileName));

                }

            }

        }

        files = recordings;

        updateFirmwareDirectoryDisplay(files);

        updateButtonText();

    }

}

function resetUI () {

    files = [];

    fileLabel.innerHTML = 'No T.WAV files selected.';

    expandButton.disabled = true;

    updateButtonText();

}

selectionRadios[0].addEventListener('change', resetUI);
selectionRadios[1].addEventListener('change', resetUI);

fileButton.addEventListener('click', selectRecordings);

expandButton.addEventListener('click', function () {

    if (expanding) {

        return;

    }

    expanding = true;
    disableUI();

    electron.ipcRenderer.send('start-bar', files.length);
    setTimeout(expandFiles, 2000);

});
