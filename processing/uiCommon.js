/****************************************************************************
 * uiCommons.js
 * openacousticdevices.info
 * February 2021
 *****************************************************************************/

/* Functions which control elements common to the expansion and split windows */

const electron = require('electron');

const nightMode = require('../nightMode.js');

const fileButton = document.getElementById('file-button');

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

        fileButton.innerText = 'Select Folders';

    }

};
