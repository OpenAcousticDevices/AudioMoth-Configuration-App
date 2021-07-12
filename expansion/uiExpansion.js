/****************************************************************************
 * uiExpansion.js
 * openacousticdevices.info
 * April 2020
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

const MAX_LENGTHS = [5, 10, 15, 30, 60, 300, 600, 3600];
const MAX_LENGTH_STRINGS = ['5 seconds', '10 seconds', '15 seconds', '30 seconds', '1 minute', '5 minutes', '10 minutes', '1 hour'];

const FILE_REGEX = /^\d\d\d\d\d\d\d\d_\d\d\d\d\d\dT.WAV$/;

const durationTabButton = document.getElementById('duration-tab-link');
const eventTabButton = document.getElementById('event-tab-link');

const silentFilesCheckbox = document.getElementById('silent-files-checkbox');
const alignmentCheckbox = document.getElementById('alignment-checkbox');

const durationMaxLengthCheckbox = document.getElementById('duration-max-length-checkbox');
const eventMaxLengthCheckbox = document.getElementById('event-max-length-checkbox');

const selectionRadios = document.getElementsByName('selection-radio');

const eventMaxLengthRadios = document.getElementsByName('event-max-length-radio');
const durationMaxLengthRadios = document.getElementsByName('duration-max-length-radio');

const overviewPanel = document.getElementById('overview-panel');

const prefixCheckbox = document.getElementById('prefix-checkbox');
const prefixInput = document.getElementById('prefix-input');

const outputCheckbox = document.getElementById('output-checkbox');
const outputButton = document.getElementById('output-button');
const outputLabel = document.getElementById('output-label');

var outputDir = '';

const fileLabel = document.getElementById('file-label');
const fileButton = document.getElementById('file-button');
const expandButton = document.getElementById('expand-button');

var files = [];
var expanding = false;

var expansionType = 'DURATION';

/* Disable UI elements in main window while progress bar is open and expansion is in progress */

function disableUI () {

    fileButton.disabled = true;
    expandButton.disabled = true;
    selectionRadios[0].disabled = true;
    selectionRadios[1].disabled = true;

    durationTabButton.disabled = true;
    eventTabButton.disabled = true;

    durationMaxLengthCheckbox.disabled = true;
    eventMaxLengthCheckbox.disabled = true;

    for (let i = 0; i < eventMaxLengthRadios.length; i++) {

        eventMaxLengthRadios[i].disabled = true;
        durationMaxLengthRadios[i].disabled = true;

    }

    silentFilesCheckbox.disabled = true;
    alignmentCheckbox.disabled = true;

    outputCheckbox.disabled = true;
    outputButton.disabled = true;

    prefixCheckbox.disabled = true;
    prefixInput.disabled = true;

}

function enableUI () {

    fileButton.disabled = false;
    expandButton.disabled = false;
    selectionRadios[0].disabled = false;
    selectionRadios[1].disabled = false;

    durationTabButton.disabled = false;
    eventTabButton.disabled = false;

    durationMaxLengthCheckbox.disabled = false;
    eventMaxLengthCheckbox.disabled = false;

    for (let i = 0; i < eventMaxLengthRadios.length; i++) {

        if (durationMaxLengthCheckbox.checked) {

            durationMaxLengthRadios[i].disabled = false;

        }

        if (eventMaxLengthCheckbox.checked) {

            eventMaxLengthRadios[i].disabled = false;

        }

    }

    silentFilesCheckbox.disabled = !durationMaxLengthCheckbox.checked;
    alignmentCheckbox.disabled = false;

    outputCheckbox.disabled = false;
    outputButton.disabled = false;

    prefixCheckbox.disabled = false;

    if (prefixCheckbox.checked) {

        prefixInput.disabled = false;

    }

    expanding = false;

}

/* Enable/disable a given set of max length radio buttons based on a checkbox */

function updateFileMaxLengthUI (elementClass, checkbox) {

    const maxLengthElements = document.getElementsByClassName(elementClass);

    const maxLengthEnabled = checkbox.checked;

    for (let i = 0; i < maxLengthElements.length; i++) {

        maxLengthElements[i].disabled = !maxLengthEnabled;
        maxLengthElements[i].style.color = maxLengthEnabled ? '' : 'lightgrey';

    }

};

/* Expand selected files */

function expandFiles () {

    if (!files) {

        return;

    }

    const generateSilentFiles = expansionType === 'DURATION' ? silentFilesCheckbox.checked : false;
    const alignToSecondTransitions = expansionType === 'EVENT' ? alignmentCheckbox.checked : false;

    const maxLengthRadioName = expansionType === 'DURATION' ? 'duration-max-length-radio' : 'event-max-length-radio';

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const errorFiles = [];

    var errorFilePath;

    let maxLength = null;

    for (let i = 0; i < files.length; i++) {

        /* If progress bar is closed, the expansion task is considered cancelled. This will contact the main thread and ask if that has happened */

        const cancelled = electron.ipcRenderer.sendSync('poll-expansion-cancelled');

        if (cancelled) {

            console.log('Expansion cancelled.');
            enableUI();
            return;

        }

        /* Let the main thread know what value to set the progress bar to */

        electron.ipcRenderer.send('set-expansion-bar-progress', i, 0, path.basename(files[i]));

        /* If max length is enabled for the current expansion mode (there is separate UI for each and only the relevant one is shown) */

        if ((durationMaxLengthCheckbox.checked && expansionType === 'DURATION') || (eventMaxLengthCheckbox.checked && expansionType === 'EVENT')) {

            maxLength = MAX_LENGTHS[ui.getSelectedRadioValue(maxLengthRadioName)];

        } else {

            maxLength = null;

        }

        console.log('Expanding:', files[i]);
        console.log('Expansion type:', expansionType);
        console.log('Maximum file length:', maxLength);

        if (expansionType === 'DURATION') {

            console.log('Generate silent files:', generateSilentFiles);

        } else {

            console.log('Align files to second transitions:', alignToSecondTransitions);

        }

        console.log('-');

        /* Check if the optional prefix/output directory setttings are being used. If left as null, expander will put expanded file(s) in the same directory as the input with no prefix */

        const outputPath = outputCheckbox.checked ? outputDir : null;
        const prefix = (prefixCheckbox.checked && prefixInput.value !== '') ? prefixInput.value : null;

        const response = audiomothUtils.expand(files[i], outputPath, prefix, expansionType, maxLength, generateSilentFiles, alignToSecondTransitions, (progress) => {

            electron.ipcRenderer.send('set-expansion-bar-progress', i, progress, path.basename(files[i]));

        });

        if (response.success) {

            successCount++;

        } else {

            /* Add error to log file */

            errorCount++;
            errors.push(response.error);
            errorFiles.push(files[i]);

            electron.ipcRenderer.send('set-expansion-bar-error', path.basename(files[i]));

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
                electron.ipcRenderer.send('set-expansion-bar-completed', successCount, errorCount, true);
                return;

            }

            ui.sleep(3000);

        }

    }

    /* Notify main thread that expansion is complete so progress bar is closed */

    electron.ipcRenderer.send('set-expansion-bar-completed', successCount, errorCount, false);

}

/* When the progress bar is complete and the summary window at the end has been displayed for a fixed amount of ttime, it will close and this re-enables the UI */

electron.ipcRenderer.on('expansion-summary-closed', enableUI);

/* Update label to reflect new file/folder selection */

function updateInputDirectoryDisplay (directoryArray) {

    if (!directoryArray || directoryArray.length === 0) {

        fileLabel.innerHTML = 'No AudioMoth T.WAV files selected.';
        expandButton.disabled = true;

    } else {

        fileLabel.innerHTML = 'Found ';
        fileLabel.innerHTML += directoryArray.length + ' AudioMoth T.WAV file';
        fileLabel.innerHTML += (directoryArray.length === 1 ? '' : 's');
        fileLabel.innerHTML += '.';
        expandButton.disabled = false;

    }

}

/* Reset UI back to default state, clearing the selected files */

function resetUI () {

    files = [];

    fileLabel.innerHTML = 'No AudioMoth T.WAV files selected.';

    expandButton.disabled = true;

    ui.updateButtonText();
    updateOverviewPanel();

}

/* Update text of overview panel to explain the result of using the current settings */

function updateOverviewPanel () {

    let fileLength;

    if (expansionType === 'DURATION') {

        if (!durationMaxLengthCheckbox.checked) {

            // 1
            overviewPanel.innerHTML = 'Expand each AudioMoth T.WAV file into a single WAV file.<br>Expansion restores silent periods between trigger events.';

        } else {

            fileLength = MAX_LENGTH_STRINGS[ui.getSelectedRadioValue('duration-max-length-radio')];

            if (!silentFilesCheckbox.checked) {

                // 2
                overviewPanel.innerHTML = 'Expand each AudioMoth T.WAV file into multiple WAV files.<br>Maximum file length is ' + fileLength + ' and silent files will not be generated.';

            } else {

                // 3
                overviewPanel.innerHTML = 'Expand each AudioMoth T.WAV file into multiple WAV files.<br>Maximum file length is ' + fileLength + '.';

            }

        }

    } else {

        if (!eventMaxLengthCheckbox.checked) {

            if (!alignmentCheckbox.checked) {

                // 1
                overviewPanel.innerHTML = 'Split each AudioMoth T.WAV file into separate events.<br>Each event generates a separate WAV file aligned to the millisecond. ';

            } else {

                // 2
                overviewPanel.innerHTML = 'Split each AudioMoth T.WAV file into separate events.<br>Each WAV file is aligned to the second and may contain multiple events.';

            }

        } else {

            fileLength = MAX_LENGTH_STRINGS[ui.getSelectedRadioValue('event-max-length-radio')];

            if (!alignmentCheckbox.checked) {

                // 3
                overviewPanel.innerHTML = 'Split each AudioMoth T.WAV file into separate events. Each event generates a separate WAV file, with maximum length of ' + fileLength + ', aligned to the millisecond.';

            } else {

                // 4
                overviewPanel.innerHTML = 'Split each AudioMoth T.WAV file into separate events. Each WAV file is aligned to the second, has a maximum length of ' + fileLength + ', and may contain multiple events.';

            }

        }

    }

}

/* Add listeners which update the overview panel whenever the max length radio buttons are used */

function addMaxLengthRadioButtonListeners () {

    for (let i = 0; i < eventMaxLengthRadios.length; i++) {

        eventMaxLengthRadios[i].addEventListener('click', updateOverviewPanel);

    }

    for (let j = 0; j < durationMaxLengthRadios.length; j++) {

        durationMaxLengthRadios[j].addEventListener('click', updateOverviewPanel);

    }

}

/* Swittch between the two expansion modes (Duration and Event-based) */

durationTabButton.addEventListener('click', () => {

    expansionType = 'DURATION';
    updateOverviewPanel();

});

eventTabButton.addEventListener('click', () => {

    expansionType = 'EVENT';
    updateOverviewPanel();

});

/* Enable/disable max length radio buttons */

durationMaxLengthCheckbox.addEventListener('click', () => {

    updateFileMaxLengthUI('duration-max-length-ui', durationMaxLengthCheckbox);
    updateOverviewPanel();

});

eventMaxLengthCheckbox.addEventListener('click', () => {

    updateFileMaxLengthUI('event-max-length-ui', eventMaxLengthCheckbox);
    updateOverviewPanel();

});

/* Add listeners which update overview panel */

alignmentCheckbox.addEventListener('click', updateOverviewPanel);
silentFilesCheckbox.addEventListener('click', updateOverviewPanel);

addMaxLengthRadioButtonListeners();

/* Initialise the overview panel */

updateOverviewPanel();

/* Initialise max length radio butttons for each block of UI elements */

updateFileMaxLengthUI('duration-max-length-ui', durationMaxLengthCheckbox);
updateFileMaxLengthUI('event-max-length-ui', eventMaxLengthCheckbox);

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

expandButton.addEventListener('click', () => {

    if (expanding) {

        return;

    }

    expanding = true;
    disableUI();

    electron.ipcRenderer.send('start-expansion-bar', files.length);
    setTimeout(expandFiles, 2000);

});
