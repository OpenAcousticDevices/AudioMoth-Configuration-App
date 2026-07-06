/****************************************************************************
 * progressBar.js
 * openacousticdevices.info
 * May 2026
 *****************************************************************************/

'use strict';

const electron = require('electron');

let progressBarMaxValue = 100;
let progressBarCurrentValue = 0;
let progressBarCancelable = false;

const progressBarWindowTitleElement = document.getElementById('progress-bar-window-title');
const progressBarHeadingElement = document.getElementById('progress-bar-heading');
const progressBarDetailElement = document.getElementById('progress-bar-detail');
const progressBarElement = document.getElementById('progress-bar');
const cancelButtonElement = document.getElementById('cancel-button');

function createProgressBar (windowTitle, heading, detail, maxValue, cancelable) {

    progressBarMaxValue = maxValue;
    progressBarCurrentValue = 0;

    progressBarCancelable = cancelable;
    if (progressBarCancelable) {

        cancelButtonElement.disabled = false;
        cancelButtonElement.addEventListener('click', () => {

            electron.ipcRenderer.send('cancel-progress-bar');

        });

    } else {

        cancelButtonElement.disabled = true;

    }

    progressBarWindowTitleElement.textContent = windowTitle;
    progressBarHeadingElement.textContent = heading;
    progressBarDetailElement.textContent = detail;
    progressBarElement.style.width = '0%';

}

function setProgressBarValue (value) {

    value = Math.min(value, progressBarMaxValue);

    progressBarCurrentValue = value;
    const percentage = (progressBarCurrentValue / progressBarMaxValue) * 100;
    progressBarElement.style.width = `${percentage}%`;

}

function setDetailText (detail) {

    console.log(`Setting detail ${detail}`);

    progressBarDetailElement.innerHTML = detail;

}

function setHeadingText (heading) {

    progressBarHeadingElement.innerHTML = heading;

}

function setWindowTitle (windowTitle) {

    progressBarWindowTitleElement.textContent = windowTitle;

}

electron.ipcRenderer.on('create-progress-bar', (event, {windowTitle, heading, detail, maxValue, cancelable}) => {

    createProgressBar(windowTitle, heading, detail, maxValue, cancelable);

});

electron.ipcRenderer.on('set-progress-bar-value', (event, value) => {

    setProgressBarValue(value);

});

electron.ipcRenderer.on('set-progress-bar-completed', () => {

    setProgressBarValue(progressBarMaxValue);

});

electron.ipcRenderer.on('set-progress-bar-detail', (event, detail) => {

    setDetailText(detail);

});

electron.ipcRenderer.on('set-progress-bar-heading', (event, heading) => {

    setHeadingText(heading);

});

electron.ipcRenderer.on('set-progress-bar-window-title', (event, windowTitle) => {

    setWindowTitle(windowTitle);

});
