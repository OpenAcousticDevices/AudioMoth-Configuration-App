/****************************************************************************
 * main.js
 * openacousticdevices.info
 * August 2019
 *****************************************************************************/

'use strict';

/* global process, __dirname */

const {app, Menu, shell, ipcMain, BrowserWindow} = require('electron');

const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const path = require('path');

const constants = require('./constants.js');
const electronDebug = require('electron-debug');

let mainWindow, aboutWindow, expansionWindow, splitWindow, downsampleWindow, summariseWindow, alignWindow, timeZoneSelectionWindow, mapWindow;

let progressBarWindow;
let progressBarMaxValue = 100;

const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';
const standardWindowSettings = {
    resizable: false,
    fullscreenable: false,
    minimizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, iconLocation),
    useContentSize: true,
    webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        sandbox: false
    }
};

let timeZoneMode = constants.TIME_ZONE_MODE_UTC;

let customTimeZone = 0;

let sunDefinitionIndex = constants.SUNRISE_AND_SUNSET;

/* Generate settings objects for windows and progress bars */

function generateSettings (width, height, title) {

    const uniqueSettings = {
        width,
        height,
        title
    };

    const settings = Object.assign({}, standardWindowSettings, uniqueSettings);
    settings.parent = mainWindow;

    return settings;

}

/* Open subwindows */

function openSplitWindow () {

    if (splitWindow) {

        splitWindow.show();
        return;

    }

    let windowWidth = 565;
    let windowHeight = 430;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 428;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 428;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Split AudioMoth WAV Files');
    splitWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(splitWindow.webContents);

    splitWindow.setMenu(null);
    splitWindow.loadFile('processing/split.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(splitWindow);

    }

    splitWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (splitWindow) {

            splitWindow.webContents.send('night-mode', nightMode);

        }

    });

    splitWindow.on('close', (e) => {

        e.preventDefault();

        if (progressBarWindow && !progressBarWindow.isDestroyed()) {

            return;

        }

        splitWindow.hide();

    });

}

function openExpansionWindow () {

    if (expansionWindow) {

        expansionWindow.show();
        return;

    }

    let windowWidth = 565;
    let windowHeight = 615;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 615;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 615;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Expand AudioMoth T.WAV Files');
    expansionWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(expansionWindow.webContents);

    expansionWindow.setMenu(null);
    expansionWindow.loadFile('processing/expansion.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(expansionWindow);

    }

    expansionWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (expansionWindow) {

            expansionWindow.webContents.send('night-mode', nightMode);

        }

    });

    expansionWindow.on('close', (e) => {

        e.preventDefault();

        if (progressBarWindow && !progressBarWindow.isDestroyed()) {

            return;

        }

        expansionWindow.hide();

    });

}

function openDownsamplingWindow () {

    if (downsampleWindow) {

        downsampleWindow.show();
        return;

    }

    let windowWidth = 565;
    let windowHeight = 428;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 428;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 428;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Downsample AudioMoth WAV Files');
    downsampleWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(downsampleWindow.webContents);

    downsampleWindow.setMenu(null);
    downsampleWindow.loadFile('processing/downsampling.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(downsampleWindow);

    }

    downsampleWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (downsampleWindow) {

            downsampleWindow.webContents.send('night-mode', nightMode);

        }

    });

    downsampleWindow.on('close', (e) => {

        e.preventDefault();

        if (progressBarWindow && !progressBarWindow.isDestroyed()) {

            return;

        }

        downsampleWindow.hide();

    });

}

function openSummariseWindow () {

    if (summariseWindow) {

        summariseWindow.show();
        return;

    }

    let windowWidth = 565;
    let windowHeight = 235;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 235;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 235;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Summarise AudioMoth Files');
    summariseWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(summariseWindow.webContents);

    summariseWindow.setMenu(null);
    summariseWindow.loadFile('processing/summarise.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(summariseWindow);

    }

    summariseWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (summariseWindow) {

            summariseWindow.webContents.send('night-mode', nightMode);

        }

    });

    summariseWindow.on('close', (e) => {

        e.preventDefault();

        summariseWindow.webContents.send('summarise-close');

        if (progressBarWindow && !progressBarWindow.isDestroyed()) {

            return;

        }

        summariseWindow.hide();

    });

}

function openAlignWindow () {

    if (alignWindow) {

        alignWindow.show();
        return;

    }

    let windowWidth = 565;
    const windowHeight = 462;

    if (process.platform === 'linux') {

        windowWidth = 560;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Synchronise AudioMoth Files');
    alignWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(alignWindow.webContents);

    alignWindow.setMenu(null);
    alignWindow.loadFile('processing/synchronising.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(alignWindow);

    }

    alignWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (alignWindow) {

            alignWindow.webContents.send('night-mode', nightMode);

        }

    });

    alignWindow.on('close', (e) => {

        e.preventDefault();

        if (progressBarWindow && !progressBarWindow.isDestroyed()) {

            return;

        }

        alignWindow.hide();

    });

}

function openAboutWindow () {

    if (aboutWindow) {

        aboutWindow.show();
        return;

    }

    let windowWidth = 400;
    let windowHeight = 310;

    if (process.platform === 'linux') {

        windowWidth = 395;
        windowHeight = 310;

    } else if (process.platform === 'darwin') {

        windowWidth = 395;
        windowHeight = 310;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'About');
    aboutWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(aboutWindow.webContents);

    aboutWindow.setMenu(null);
    aboutWindow.loadFile('about.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(aboutWindow);

    }

    aboutWindow.on('close', (e) => {

        e.preventDefault();

        aboutWindow.hide();

    });

    aboutWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (aboutWindow) {

            aboutWindow.webContents.send('night-mode', nightMode);

        }

    });

}

function openMapWindow (event, lat, lon) {

    const windowWidth = 600;
    const windowHeight = 550;

    const newZoom = lat[0] === 0 && lat[1] === 0 && lon[0] === 0 && lon[1] === 0 ? 5 : 12;

    if (mapWindow) {

        mapWindow.webContents.send('update-location-sub-window', lat, lon, true, newZoom);

        mapWindow.show();
        return;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Select Location');
    settings.resizable = true;
    mapWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(mapWindow.webContents);

    mapWindow.setMenu(null);
    mapWindow.loadFile('map.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(mapWindow);

    }

    mapWindow.webContents.userAgent = 'AudioMoth Configuration App/1.12.2 (+https://openacousticdevices.info; contact: theteam@openacousticdevices.info)';

    mapWindow.on('close', (e) => {

        e.preventDefault();
        mapWindow.hide();

    });

    mapWindow.webContents.on('dom-ready', () => {

        /* If the co-ordinate text boxes have been changed from the default then zoom in when you load the window */

        mapWindow.webContents.send('update-location-sub-window', lat, lon, true, newZoom);

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (mapWindow) {

            mapWindow.webContents.send('night-mode', nightMode);

        }

    });

}

ipcMain.on('open-map-window', openMapWindow);

function openTimeZoneSelectionWindow () {

    let windowWidth = 448;
    let windowHeight = 135;

    if (process.platform === 'linux') {

        windowWidth = 443;
        windowHeight = 138;

    } else if (process.platform === 'darwin') {

        windowWidth = 443;
        windowHeight = 138;

    }

    if (timeZoneSelectionWindow) {

        timeZoneSelectionWindow.show();
        return;

    }

    const settings = generateSettings(windowWidth, windowHeight, 'Select Custom Time Zone');
    timeZoneSelectionWindow = new BrowserWindow(settings);

    require('@electron/remote/main').enable(timeZoneSelectionWindow.webContents);

    timeZoneSelectionWindow.setMenu(null);
    timeZoneSelectionWindow.loadFile('timeZoneSelection.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(timeZoneSelectionWindow);

    }

    timeZoneSelectionWindow.on('close', (e) => {

        e.preventDefault();
        timeZoneSelectionWindow.hide();

    });

    timeZoneSelectionWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (timeZoneSelectionWindow) {

            timeZoneSelectionWindow.webContents.send('night-mode', nightMode);

        }

    });

}

function toggleNightMode () {

    mainWindow.webContents.send('night-mode');

    const subwindows = [aboutWindow, expansionWindow, splitWindow, downsampleWindow, summariseWindow, alignWindow, timeZoneSelectionWindow];

    for (let index = 0; index < subwindows.length; index++) {

        if (subwindows[index]) {

            subwindows[index].webContents.send('night-mode');

        }

    }

}

function updateAmplitudeThreshold (index) {

    const menu = Menu.getApplicationMenu();

    for (let i = 0; i < 3; i++) {

        const menuItem = menu.getMenuItemById('scale_' + i);

        menuItem.checked = i === index;

    }

    mainWindow.webContents.send('amplitude-threshold-scale', index);

}

function updateSunDefinition (index) {

    const menu = Menu.getApplicationMenu();

    for (let i = 0; i < 4; i++) {

        const menuItem = menu.getMenuItemById('sun_' + i);

        menuItem.checked = i === index;

    }

    sunDefinitionIndex = index;
    mainWindow.webContents.send('sun-definition-change', sunDefinitionIndex);

}

app.on('ready', () => {

    let windowWidth = 565;
    let windowHeight = 628;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 654;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 685;

    }

    mainWindow = new BrowserWindow({
        title: 'AudioMoth Configuration App',
        width: windowWidth,
        height: windowHeight,
        resizable: false,
        fullscreenable: false,
        useContentSize: true,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.setSize(windowWidth, windowHeight);

    const fileMenu = {
        label: 'File',
        submenu: [{
            label: 'Open Configuration',
            accelerator: 'CommandOrControl+O',
            click: () => {

                mainWindow.webContents.send('load');

            }
        }, {
            label: 'Save Configuration',
            accelerator: 'CommandOrControl+S',
            click: () => {

                mainWindow.webContents.send('save');

            }
        }, {
            type: 'separator'
        }, {
            id: 'copyid',
            label: 'Copy Device ID',
            accelerator: 'CommandOrControl+I',
            click: () => {

                mainWindow.webContents.send('copy-id');

            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'nightmode',
            label: 'Night Mode',
            accelerator: 'CommandOrControl+N',
            checked: false,
            click: toggleNightMode
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'scale_1',
            label: '16-Bit Amplitude Threshold Scale',
            checked: false,
            click: () => {

                updateAmplitudeThreshold(1);

            }
        }, {
            type: 'checkbox',
            id: 'scale_2',
            label: 'Decibel Amplitude Threshold Scale',
            checked: false,
            click: () => {

                updateAmplitudeThreshold(2);

            }
        }, {
            type: 'checkbox',
            id: 'scale_0',
            label: 'Percentage Amplitude Threshold Scale',
            checked: true,
            click: () => {

                updateAmplitudeThreshold(0);

            }
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'sun_0',
            label: 'Sunrise And Sunset',
            checked: true,
            click: () => {

                updateSunDefinition(constants.SUNRISE_AND_SUNSET);

            }
        }, {
            type: 'checkbox',
            id: 'sun_1',
            label: 'Civil Dawn And Dusk',
            checked: false,
            click: () => {

                updateSunDefinition(constants.CIVIL_DAWN_AND_DUSK);

            }
        }, {
            type: 'checkbox',
            id: 'sun_2',
            label: 'Nautical Dawn And Dusk',
            checked: false,
            click: () => {

                updateSunDefinition(constants.NAUTICAL_DAWN_AND_DUSK);

            }
        }, {
            type: 'checkbox',
            id: 'sun_3',
            label: 'Astronomical Dawn And Dusk',
            checked: false,
            click: () => {

                updateSunDefinition(constants.ASTRONOMICAL_DAWN_AND_DUSK);

            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'CommandOrControl+Q',
            click: () => {

                app.quit();

            }
        }]
    };

    const timeZoneMenu = {
        label: 'Time',
        submenu: [{
            type: 'checkbox',
            id: 'timeZone_0',
            label: 'UTC',
            checked: true,
            click: () => {

                setTimeZoneModeMenu(constants.TIME_ZONE_MODE_UTC);

                mainWindow.webContents.send('change-time-zone-mode', constants.TIME_ZONE_MODE_UTC);
                mainWindow.webContents.send('update-schedule');

            }
        }, {
            type: 'checkbox',
            id: 'timeZone_1',
            label: 'Local',
            checked: false,
            click: () => {

                setTimeZoneModeMenu(constants.TIME_ZONE_MODE_LOCAL);

                mainWindow.webContents.send('change-time-zone-mode', constants.TIME_ZONE_MODE_LOCAL);
                mainWindow.webContents.send('update-schedule');

            }
        }, {
            type: 'checkbox',
            id: 'timeZone_2',
            label: 'Custom',
            checked: false,
            click: () => {

                updateTimeZoneMenuCheckbox();

                openTimeZoneSelectionWindow();

            }
        }]
    };

    const processMenu = {
        label: 'Process',
        submenu: [{
            label: 'Split AudioMoth WAV Files',
            click: openSplitWindow
        }, {
            label: 'Expand AudioMoth T.WAV Files',
            click: openExpansionWindow
        }, {
            label: 'Downsample AudioMoth WAV Files',
            click: openDownsamplingWindow
        }, {
            type: 'separator'
        }, {
            label: 'Synchronise AudioMoth WAV Files Using GPS Data',
            click: openAlignWindow
        }, {
            type: 'separator'
        }, {
            label: 'Summarise AudioMoth Files',
            click: openSummariseWindow
        }]
    };

    const helpMenu = {
        label: 'Help',
        submenu: [{
            label: 'About',
            click: openAboutWindow
        }, {
            label: 'Check For Updates',
            click: () => {

                mainWindow.webContents.send('update-check');

            }
        }, {
            type: 'separator'
        }, {
            label: 'AudioMoth Play Website',
            click: () => {

                shell.openExternal('https://play.openacousticdevices.info/');

            }
        }, {
            type: 'separator'
        }, {
            label: 'Open Acoustic Devices Website',
            click: () => {

                shell.openExternal('https://openacousticdevices.info');

            }
        }]
    };

    const menuTemplate = [fileMenu, processMenu, timeZoneMenu, helpMenu];

    const menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    require('@electron/remote/main').enable(mainWindow.webContents);

    mainWindow.loadFile('index.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(mainWindow);

    }

});

app.on('window-all-closed', () => {

    app.quit();

});

app.disableHardwareAcceleration();

/* Progress bar functions */

function createProgressBar (windowTitle, heading, detail, maxValue, parentWindow) {

    if (!progressBarWindow || progressBarWindow.isDestroyed()) {

        let windowWidth = 500;
        const windowHeight = 200;

        if (process.platform === 'linux') {

            windowWidth = 495;

        } else if (process.platform === 'darwin') {

            windowWidth = 495;

        }

        const settings = generateSettings(windowWidth, windowHeight, '');
        progressBarWindow = new BrowserWindow({
            ...settings,
            modal: true,
            parent: parentWindow
        });

        require('@electron/remote/main').enable(progressBarWindow.webContents);

        progressBarWindow.setMenu(null);
        progressBarWindow.loadFile('progressBar.html');

        if (!app.isPackaged) {

            electronDebug.openDevTools(progressBarWindow);

        }

        progressBarWindow.on('close', (e) => {

            e.preventDefault();

        });

    } else {

        progressBarWindow.show();

    }

    progressBarWindow.webContents.once('dom-ready', () => {

        progressBarWindow.webContents.send('create-progress-bar', {
            windowTitle,
            heading,
            detail,
            maxValue,
            cancelable: true
        });

        progressBarMaxValue = maxValue;

    });

}

function cancelProgressBarWindow () {

    if (!progressBarWindow.isDestroyed()) {

        closeProgressBarWindow();

    }

}

function closeProgressBarWindow () {

    if (!progressBarWindow.isDestroyed()) {

        progressBarWindow.destroy();

    }

}

ipcMain.on('cancel-progress-bar', cancelProgressBarWindow);

function setBarProgress (event, fileNum, progress) {

    if (!progressBarWindow.isDestroyed()) {

        progressBarWindow.webContents.send('set-progress-bar-value', (fileNum * 100) + progress);

    }

}

function setProgressBarError (verb, name) {

    if (!progressBarWindow.isDestroyed()) {

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Error when ' + verb + ' ' + name + '.');

    }

}

function pollCancelled (event) {

    if (!progressBarWindow.isDestroyed()) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

}

/* Expansion progress bar functions */

ipcMain.on('start-expansion-bar', (event, fileCount) => {

    let detail = 'Starting to expand file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    createProgressBar('AudioMoth Configuration App - Expansion', 'Expanding files...', detail, fileCount * 100, expansionWindow);

});

ipcMain.on('set-expansion-bar-progress', setBarProgress);

ipcMain.on('set-expansion-bar-file', (event, fileNum, name) => {

    if (!progressBarWindow.isDestroyed()) {

        const index = fileNum + 1;

        const fileCount = progressBarMaxValue / 100;

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Expanding ' + name + ' (' + index + ' of ' + fileCount + ').');

    }

});

ipcMain.on('set-expansion-bar-error', (event, name) => {

    setProgressBarError('expanding', name);

});

ipcMain.on('set-expansion-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (!progressBarWindow.isDestroyed()) {

        let messageText;

        progressBarWindow.webContents.send('set-progress-bar-completed');

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '. ';

            if (errorWritingLog) {

                messageText += 'Failed to write ERRORS.TXT to destination.';

            } else {

                messageText += 'See ERRORS.TXT for details.';

            }

        } else {

            messageText = 'Successfully expanded ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        }

        progressBarWindow.webContents.send('set-progress-bar-detail', messageText);

        setTimeout(() => {

            closeProgressBarWindow();

            if (expansionWindow) {

                expansionWindow.webContents.send('expansion-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-expansion-cancelled', pollCancelled);

/* Splitting progress bar functions */

ipcMain.on('start-split-bar', (event, fileCount) => {

    let detail = 'Starting to split file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    createProgressBar('AudioMoth Configuration App - Splitting', 'Splitting files...', detail, fileCount * 100, splitWindow);

});

ipcMain.on('set-split-bar-progress', setBarProgress);

ipcMain.on('set-split-bar-file', (event, fileNum, name) => {

    if (!progressBarWindow.isDestroyed()) {

        const index = fileNum + 1;

        const fileCount = progressBarMaxValue / 100;

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Splitting ' + name + ' (' + index + ' of ' + fileCount + ').');

    }

});

ipcMain.on('set-split-bar-error', (event, name) => {

    setProgressBarError('splitting', name);

});

ipcMain.on('set-split-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (!progressBarWindow.isDestroyed()) {

        let messageText;

        progressBarWindow.webContents.send('set-progress-bar-completed');

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '. ';

            if (errorWritingLog) {

                messageText += 'Failed to write ERRORS.TXT to destination.';

            } else {

                messageText += 'See ERRORS.TXT for details.';

            }

        } else {

            messageText = 'Successfully split ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        }

        progressBarWindow.webContents.send('set-progress-bar-detail', messageText);

        setTimeout(() => {

            closeProgressBarWindow();

            if (splitWindow) {

                splitWindow.webContents.send('split-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-split-cancelled', pollCancelled);

/* Downsampling progress bar functions */

ipcMain.on('start-downsample-bar', (event, fileCount) => {

    let detail = 'Starting to downsample file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    createProgressBar('AudioMoth Configuration App - Downsampling', 'Downsampling files...', detail, fileCount * 100, downsampleWindow);

});

ipcMain.on('set-downsample-bar-progress', setBarProgress);

ipcMain.on('set-downsample-bar-file', (event, fileNum, name) => {

    if (!progressBarWindow.isDestroyed()) {

        const index = fileNum + 1;
        const fileCount = progressBarMaxValue / 100;

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Downsampling ' + name + ' (' + index + ' of ' + fileCount + ').');

    }

});

ipcMain.on('set-downsample-bar-error', (event, name) => {

    setProgressBarError('downsampling', name);

});

ipcMain.on('set-downsample-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (!progressBarWindow.isDestroyed()) {

        let messageText;

        progressBarWindow.webContents.send('set-progress-bar-completed');

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '. ';

            if (errorWritingLog) {

                messageText += 'Failed to write ERRORS.TXT to destination.';

            } else {

                messageText += 'See ERRORS.TXT for details.';

            }

        } else {

            messageText = 'Successfully downsampled ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        }

        progressBarWindow.webContents.send('set-progress-bar-detail', messageText);

        setTimeout(() => {

            closeProgressBarWindow();

            if (downsampleWindow) {

                downsampleWindow.webContents.send('downsample-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-downsample-cancelled', pollCancelled);

/* Summarising progress bar functions */

ipcMain.on('start-summarise-bar', (event, fileCount) => {

    let detail = 'Starting to summarise file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    createProgressBar('AudioMoth Configuration App - Summarising', 'Summarising files...', detail, fileCount * 100, summariseWindow);

});

ipcMain.on('set-summarise-bar-progress', setBarProgress);

ipcMain.on('set-summarise-bar-file', (event, fileNum, name) => {

    if (!progressBarWindow.isDestroyed()) {

        const index = fileNum + 1;
        const fileCount = progressBarMaxValue / 100;

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Summarising ' + name + ' (' + index + ' of ' + fileCount + ').');

    }

});

ipcMain.on('set-summarise-bar-error', (event, name) => {

    setProgressBarError('summarising', name);

});

ipcMain.on('set-summarise-bar-completed', (event, successCount, finaliseResult) => {

    if (!progressBarWindow.isDestroyed()) {

        let messageText;

        progressBarWindow.webContents.send('set-progress-bar-completed');

        if (finaliseResult.success) {

            messageText = 'Successfully summarised ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        } else {

            messageText = 'Failed to write summary file. ';
            messageText += finaliseResult.error;

        }

        progressBarWindow.webContents.send('set-progress-bar-detail', messageText);

        setTimeout(() => {

            closeProgressBarWindow();

            if (summariseWindow) {

                summariseWindow.webContents.send('summarise-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-summarise-cancelled', pollCancelled);

/* Aligning progress bar functions */

ipcMain.on('start-align-bar', (event, fileCount) => {

    let detail = 'Starting to synchronise file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    createProgressBar('AudioMoth Configuration App - Synchronising', 'Synchronising files...', detail, fileCount * 100, alignWindow);

});

ipcMain.on('set-align-bar-progress', setBarProgress);

ipcMain.on('set-align-bar-file', (event, fileNum, name) => {

    if (!progressBarWindow.isDestroyed()) {

        const index = fileNum + 1;
        const fileCount = progressBarMaxValue / 100;

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Synchronising ' + name + ' (' + index + ' of ' + fileCount + ').');

    }

});

ipcMain.on('set-align-bar-initialise-error', (event, error) => {

    if (!progressBarWindow.isDestroyed()) {

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Error when initialising: ' + error);

    }

});

ipcMain.on('set-align-bar-file-error', (event, name) => {

    if (!progressBarWindow.isDestroyed()) {

        progressBarWindow.webContents.send('set-progress-bar-detail', 'Error when synchronising ' + name + '.');

    }

});

ipcMain.on('set-align-bar-completed', (event, successCount, errorCount) => {

    if (!progressBarWindow.isDestroyed()) {

        let messageText;

        progressBarWindow.webContents.send('set-progress-bar-completed');

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '. ';
            messageText += 'See ERRORS.TXT for details.';

        } else {

            messageText = 'Successfully synchronised ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        }

        progressBarWindow.webContents.send('set-progress-bar-detail', messageText);

        setTimeout(() => {

            closeProgressBarWindow();

            if (alignWindow) {

                alignWindow.webContents.send('align-summary-closed');

            }

        }, 5000);

    } else {

        alignWindow.webContents.send('align-summary-closed');

    }

});

ipcMain.on('poll-align-cancelled', pollCancelled);

/* Update which amplitude threshold scale option is checked in menu */

ipcMain.on('set-amplitude-threshold-scale', (event, index) => {

    const menu = Menu.getApplicationMenu();

    const scaleMenuItems = [menu.getMenuItemById('scale_0'), menu.getMenuItemById('scale_1'), menu.getMenuItemById('scale_2')];

    scaleMenuItems[index].checked = true;

});

/* Update which time zone option is checked in menu */

function updateTimeZoneMenuCheckbox () {

    const menu = Menu.getApplicationMenu();

    const timeZoneMenuItems = [menu.getMenuItemById('timeZone_0'), menu.getMenuItemById('timeZone_1'), menu.getMenuItemById('timeZone_2')];

    for (let i = 0; i < timeZoneMenuItems.length; i++) {

        timeZoneMenuItems[i].checked = i === timeZoneMode;

    }

}

function setTimeZoneModeMenu (index) {

    timeZoneMode = index;

    updateTimeZoneMenuCheckbox();

}

ipcMain.on('set-time-zone-menu', (event, mode) => {

    setTimeZoneModeMenu(mode);

});

ipcMain.on('set-custom-time-zone', (event, tz) => {

    const newTimeZoneMode = tz === 0 ? constants.TIME_ZONE_MODE_UTC : constants.TIME_ZONE_MODE_CUSTOM;

    setTimeZoneModeMenu(newTimeZoneMode);

    customTimeZone = tz;

    mainWindow.webContents.send('change-time-zone-mode', newTimeZoneMode);
    mainWindow.webContents.send('update-schedule');

});

ipcMain.on('request-custom-time-zone', (event) => {

    event.returnValue = customTimeZone;

});

ipcMain.on('request-sun-definition-index', (event) => {

    event.returnValue = sunDefinitionIndex;

});

ipcMain.on('set-sun-definition-index', (event, index) => {

    sunDefinitionIndex = index;

    const menu = Menu.getApplicationMenu();
    const sunDefinitionRadioButtons = [menu.getMenuItemById('sun_0'), menu.getMenuItemById('sun_1'), menu.getMenuItemById('sun_2'), menu.getMenuItemById('sun_3')];

    sunDefinitionRadioButtons[sunDefinitionIndex].checked = true;

});

ipcMain.on('update-location-main-window', (event, latArray, lonArray) => {

    mainWindow.webContents.send('update-location', latArray, lonArray);

});

ipcMain.on('update-location-sub-window', (event, lat, lon) => {

    if (mapWindow) {

        mapWindow.webContents.send('update-location-sub-window', lat, lon, false);

    }

});
