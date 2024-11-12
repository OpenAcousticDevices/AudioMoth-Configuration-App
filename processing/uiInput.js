/****************************************************************************
 * uiInput.js
 * openacousticdevices.info
 * September 2023
 *****************************************************************************/

const {dialog, getCurrentWindow} = require('@electron/remote');
const currentWindow = getCurrentWindow();

const path = require('path');
const fs = require('fs');

const selectionRadios = document.getElementsByName('selection-radio');

let previousSelection = [];

function getSelectedRadioValue (radioName) {

    return parseInt(document.querySelector('input[name="' + radioName + '"]:checked').value);

}

/* Open dialog and set files to be processed */

exports.selectRecordings = (fileRegex) => {

    let folderContents, filePath, fileName, recordings;

    const selectionTypes = ['openFile', 'openDirectory'];
    const selectionType = getSelectedRadioValue('selection-radio');
    const properties = [selectionTypes[selectionType], 'multiSelections'];

    /* If files are being selected, limit selection to .wav files */

    const filters = (selectionType === 0) ? [{name: 'wav', extensions: ['wav']}] : [];

    const openPath = previousSelection.length > 0 ? path.dirname(previousSelection[0]) : '';

    const selection = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select recording file or folder containing recordings',
        nameFieldLabel: 'Recordings',
        properties,
        filters,
        defaultPath: openPath
    });

    if (selection) {

        previousSelection = selection;

        recordings = [];

        if (selectionType === 0) {

            for (let i = 0; i < selection.length; i++) {

                filePath = selection[i];
                fileName = path.basename(filePath);

                /* Check if wav files match a given regex */

                if (fileName.charAt(0) !== '.' && fileRegex.test(fileName.toUpperCase())) {

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

function walk (dir) {

    let results = [];

    /* Check directory is not hidden */

    const dirName = path.basename(dir);

    if (dirName.charAt(0) === '.') return results;

    /* Try to read the directory contents */

    let list;

    try {

        list = fs.readdirSync(dir);

    } catch (e) {

        return results;

    }

    /* Process each file in the directory */

    list.forEach((file) => {

        const filePath = path.join(dir, file);

        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {

            results = results.concat(walk(filePath));

        } else {

            if (file.charAt(0) !== '.') {

                results.push(filePath);

            }

        }

    });

    return results;

}

exports.selectAllFilesInFolder = () => {

    const selection = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select folder containing files',
        nameFieldLabel: 'Recordings',
        properties: ['openDirectory'],
        filters: []
    });

    return updateFilesInFolder(selection);

};

function updateFilesInFolder (selection) {

    let files;

    if (selection && selection[0]) {

        if (!fs.existsSync(selection[0])) {

            return;

        }

        files = [];

        for (let i = 0; i < selection.length; i++) {

            const folderContents = walk(selection[i]);

            files = files.concat(folderContents);

        }

        return {
            selection,
            folder: selection[0],
            files
        };

    }

}

exports.updateFilesInFolder = updateFilesInFolder;

function resetPreviousSelection () {

    previousSelection = [];

}

if (selectionRadios.length > 0) {

    selectionRadios[0].addEventListener('change', resetPreviousSelection);
    selectionRadios[1].addEventListener('change', resetPreviousSelection);

}
