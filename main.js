/****************************************************************************
 * main.js
 * openacousticdevices.info
 * August 2019
 *****************************************************************************/

'use strict';

const {app, Menu, shell, ipcMain, BrowserWindow} = require('electron');

require('@electron/remote/main').initialize();

const path = require('path');

const constants = require('./constants.js');

const ProgressBar = require('electron-progressbar');

require('electron-debug')({
    showDevTools: true,
    devToolsMode: 'undocked'
});

let mainWindow, aboutWindow, expansionWindow, splitWindow, downsampleWindow, summariseWindow, timeZoneSelectionWindow, mapWindow;

const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';
const standardWindowSettings = {
    resizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, iconLocation),
    useContentSize: true,
    webPreferences: {
        enableRemoteModule: true,
        nodeIntegration: true,
        contextIsolation: false
    }
};

let expandProgressBar, splitProgressBar, downsampleProgressBar, summariseProgressBar;

const standardProgressBarSettings = {
    closeOnComplete: false,
    indeterminate: false
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

function generateProgressBarSettings (title, text, detail, fileCount, parent) {

    const uniqueSettings = {
        title,
        text,
        detail,
        maxValue: fileCount * 100
    };

    const settings = Object.assign({}, standardProgressBarSettings, uniqueSettings);

    settings.browserWindow = {
        parent,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        closable: true,
        modal: false,
        height: process.platform === 'linux' ? 140 : 175
    };

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

    splitWindow.setMenu(null);
    splitWindow.loadURL(path.join('file://', __dirname, 'processing/split.html'));

    require('@electron/remote/main').enable(splitWindow.webContents);

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

        if (splitProgressBar) {

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

    expansionWindow.setMenu(null);
    expansionWindow.loadURL(path.join('file://', __dirname, 'processing/expansion.html'));

    require('@electron/remote/main').enable(expansionWindow.webContents);

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

        if (expandProgressBar) {

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

    downsampleWindow.setMenu(null);
    downsampleWindow.loadURL(path.join('file://', __dirname, 'processing/downsampling.html'));

    require('@electron/remote/main').enable(downsampleWindow.webContents);

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

        if (downsampleProgressBar) {

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

    summariseWindow.setMenu(null);
    summariseWindow.loadURL(path.join('file://', __dirname, 'processing/summarise.html'));

    require('@electron/remote/main').enable(summariseWindow.webContents);

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

        if (summariseProgressBar) {

            return;

        }

        summariseWindow.hide();

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

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(path.join('file://', __dirname, '/about.html'));

    require('@electron/remote/main').enable(aboutWindow.webContents);

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

    mapWindow.setMenu(null);
    mapWindow.loadURL(path.join('file://', __dirname, '/map.html'));

    require('@electron/remote/main').enable(mapWindow.webContents);

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

    timeZoneSelectionWindow.setMenu(null);
    timeZoneSelectionWindow.loadURL(path.join('file://', __dirname, '/timeZoneSelection.html'));

    require('@electron/remote/main').enable(timeZoneSelectionWindow.webContents);

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

    const subwindows = [aboutWindow, expansionWindow, splitWindow, downsampleWindow, summariseWindow, timeZoneSelectionWindow];

    for (let index = 0; index < subwindows.length; index++) {

        if (subwindows[index]) {

            subwindows[index].webContents.send('night-mode');

        }

    }

}

app.on('ready', () => {

    let windowWidth = 565;
    let windowHeight = 675;

    if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 654;

    } else if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 656;

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

    require('@electron/remote/main').enable(mainWindow.webContents);

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
            type: 'radio',
            id: 'scale1',
            label: '16-Bit Amplitude Threshold Scale',
            checked: false,
            click: () => {

                mainWindow.webContents.send('amplitude-threshold-scale', 1);

            }
        }, {
            type: 'radio',
            id: 'scale2',
            label: 'Decibel Amplitude Threshold Scale',
            checked: false,
            click: () => {

                mainWindow.webContents.send('amplitude-threshold-scale', 2);

            }
        }, {
            type: 'radio',
            id: 'scale0',
            label: 'Percentage Amplitude Threshold Scale',
            checked: true,
            click: () => {

                mainWindow.webContents.send('amplitude-threshold-scale', 0);

            }
        }, {
            type: 'separator'
        }, {
            type: 'radio',
            id: 'sun0',
            label: 'Sunrise And Sunset',
            checked: true,
            click: () => {

                sunDefinitionIndex = constants.SUNRISE_AND_SUNSET;
                mainWindow.webContents.send('sun-definition-change', sunDefinitionIndex);

            }
        }, {
            type: 'radio',
            id: 'sun1',
            label: 'Civil Dawn And Dusk',
            checked: false,
            click: () => {

                sunDefinitionIndex = constants.CIVIL_DAWN_AND_DUSK;
                mainWindow.webContents.send('sun-definition-change', sunDefinitionIndex);

            }
        }, {
            type: 'radio',
            id: 'sun2',
            label: 'Nautical Dawn And Dusk',
            checked: false,
            click: () => {

                sunDefinitionIndex = constants.NAUTICAL_DAWN_AND_DUSK;
                mainWindow.webContents.send('sun-definition-change', sunDefinitionIndex);

            }
        }, {
            type: 'radio',
            id: 'sun3',
            label: 'Astronomical Dawn And Dusk',
            checked: false,
            click: () => {

                sunDefinitionIndex = constants.ASTRONOMICAL_DAWN_AND_DUSK;
                mainWindow.webContents.send('sun-definition-change', sunDefinitionIndex);

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
            id: 'timeZone0',
            label: 'UTC',
            checked: true,
            click: () => {

                setTimeZoneModeMenu(constants.TIME_ZONE_MODE_UTC);

                mainWindow.webContents.send('change-time-zone-mode', constants.TIME_ZONE_MODE_UTC);
                mainWindow.webContents.send('update-schedule');

            }
        }, {
            type: 'checkbox',
            id: 'timeZone1',
            label: 'Local',
            checked: false,
            click: () => {

                setTimeZoneModeMenu(constants.TIME_ZONE_MODE_LOCAL);

                mainWindow.webContents.send('change-time-zone-mode', constants.TIME_ZONE_MODE_LOCAL);
                mainWindow.webContents.send('update-schedule');

            }
        }, {
            type: 'checkbox',
            id: 'timeZone2',
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

    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

});

app.on('window-all-closed', () => {

    app.quit();

});

app.disableHardwareAcceleration();

/* Expansion progress bar functions */

ipcMain.on('start-expansion-bar', (event, fileCount) => {

    if (expandProgressBar) {

        return;

    }

    let detail = 'Starting to expand file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    const settings = generateProgressBarSettings('AudioMoth Configuration App - Expansion', 'Expanding files...', detail, fileCount, expansionWindow);

    expandProgressBar = new ProgressBar(settings);

    expandProgressBar.on('aborted', () => {

        if (expandProgressBar) {

            expandProgressBar.close();
            expandProgressBar = null;

        }

    });

});

ipcMain.on('set-expansion-bar-progress', (event, fileNum, progress) => {

    if (expandProgressBar) {

        expandProgressBar.value = (fileNum * 100) + progress;

    }

});

ipcMain.on('set-expansion-bar-file', (event, fileNum, name) => {

    if (expandProgressBar) {

        const index = fileNum + 1;
        const fileCount = expandProgressBar.getOptions().maxValue / 100;

        expandProgressBar.detail = 'Expanding ' + name + ' (' + index + ' of ' + fileCount + ').';

    }

});

ipcMain.on('set-expansion-bar-error', (event, name) => {

    if (expandProgressBar) {

        expandProgressBar.detail = 'Error when expanding ' + name + '.';

    }

});

ipcMain.on('set-expansion-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (expandProgressBar) {

        let messageText;

        expandProgressBar.setCompleted();

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '.<br>';

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

        expandProgressBar.detail = messageText;

        setTimeout(() => {

            expandProgressBar.close();
            expandProgressBar = null;

            if (expansionWindow) {

                expansionWindow.send('expansion-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-expansion-cancelled', (event) => {

    if (expandProgressBar) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

});

/* Splitting progress bar functions */

ipcMain.on('start-split-bar', (event, fileCount) => {

    if (splitProgressBar) {

        return;

    }

    let detail = 'Starting to split file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    const settings = generateProgressBarSettings('AudioMoth Configuration App - Splitting', 'Splitting files...', detail, fileCount, splitWindow);

    splitProgressBar = new ProgressBar(settings);

    splitProgressBar.on('aborted', () => {

        if (splitProgressBar) {

            splitProgressBar.close();
            splitProgressBar = null;

        }

    });

});

ipcMain.on('set-split-bar-progress', (event, fileNum, progress) => {

    if (splitProgressBar) {

        splitProgressBar.value = (fileNum * 100) + progress;

    }

});

ipcMain.on('set-split-bar-file', (event, fileNum, name) => {

    if (splitProgressBar) {

        const index = fileNum + 1;
        const fileCount = splitProgressBar.getOptions().maxValue / 100;

        splitProgressBar.detail = 'Splitting ' + name + ' (' + index + ' of ' + fileCount + ').';

    }

});

ipcMain.on('set-split-bar-error', (event, name) => {

    if (splitProgressBar) {

        splitProgressBar.detail = 'Error when splitting ' + name + '.';

    }

});

ipcMain.on('set-split-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (splitProgressBar) {

        let messageText;

        splitProgressBar.setCompleted();

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '.<br>';

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

        splitProgressBar.detail = messageText;

        setTimeout(() => {

            splitProgressBar.close();
            splitProgressBar = null;

            if (splitWindow) {

                splitWindow.send('split-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-split-cancelled', (event) => {

    if (splitProgressBar) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

});

/* Downsampling progress bar functions */

ipcMain.on('start-downsample-bar', (event, fileCount) => {

    if (downsampleProgressBar) {

        return;

    }

    let detail = 'Starting to downsample file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    const settings = generateProgressBarSettings('AudioMoth Configuration App - Downsampling', 'Downsampling files...', detail, fileCount, downsampleWindow);

    downsampleProgressBar = new ProgressBar(settings);

    downsampleProgressBar.on('aborted', () => {

        if (downsampleProgressBar) {

            downsampleProgressBar.close();
            downsampleProgressBar = null;

        }

    });

});

ipcMain.on('set-downsample-bar-progress', (event, fileNum, progress) => {

    if (downsampleProgressBar) {

        downsampleProgressBar.value = (fileNum * 100) + progress;

    }

});

ipcMain.on('set-downsample-bar-file', (event, fileNum, name) => {

    if (downsampleProgressBar) {

        const index = fileNum + 1;
        const fileCount = downsampleProgressBar.getOptions().maxValue / 100;

        downsampleProgressBar.detail = 'Downsampling ' + name + ' (' + index + ' of ' + fileCount + ').';

    }

});

ipcMain.on('set-downsample-bar-error', (event, name) => {

    if (downsampleProgressBar) {

        downsampleProgressBar.detail = 'Error when downsampling ' + name + '.';

    }

});

ipcMain.on('set-downsample-bar-completed', (event, successCount, errorCount, errorWritingLog) => {

    if (downsampleProgressBar) {

        let messageText;

        downsampleProgressBar.setCompleted();

        if (errorCount > 0) {

            messageText = 'Errors occurred in ' + errorCount + ' file';
            messageText += (errorCount === 1 ? '' : 's');
            messageText += '.<br>';

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

        downsampleProgressBar.detail = messageText;

        setTimeout(() => {

            downsampleProgressBar.close();
            downsampleProgressBar = null;

            if (downsampleWindow) {

                downsampleWindow.send('downsample-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-downsample-cancelled', (event) => {

    if (downsampleProgressBar) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

});

/* Summarising progress bar functions */

ipcMain.on('start-summarise-bar', (event, fileCount) => {

    if (summariseProgressBar) {

        return;

    }

    let detail = 'Starting to summarise file';
    detail += (fileCount > 1) ? 's' : '';
    detail += '.';

    const settings = generateProgressBarSettings('AudioMoth Configuration App - Summarising', 'Summarising files...', detail, fileCount, summariseWindow);

    summariseProgressBar = new ProgressBar(settings);

    summariseProgressBar.on('aborted', () => {

        if (summariseProgressBar) {

            summariseProgressBar.close();
            summariseProgressBar = null;

        }

    });

});

ipcMain.on('set-summarise-bar-progress', (event, fileNum, progress) => {

    if (summariseProgressBar) {

        summariseProgressBar.value = (fileNum * 100) + progress;

    }

});

ipcMain.on('set-summarise-bar-file', (event, fileNum, name) => {

    if (summariseProgressBar) {

        const index = fileNum + 1;
        const fileCount = summariseProgressBar.getOptions().maxValue / 100;

        summariseProgressBar.detail = 'Summarising ' + name + ' (' + index + ' of ' + fileCount + ').';

    }

});

ipcMain.on('set-summarise-bar-error', (event, name) => {

    if (summariseProgressBar) {

        summariseProgressBar.detail = 'Error when summarising ' + name + '.';

    }

});

ipcMain.on('set-summarise-bar-completed', (event, successCount, finaliseResult) => {

    if (summariseProgressBar) {

        let messageText;

        summariseProgressBar.setCompleted();

        if (finaliseResult.success) {

            messageText = 'Successfully summarised ' + successCount + ' file';
            messageText += (successCount === 1 ? '' : 's');
            messageText += '.';

        } else {

            messageText = 'Failed to write summary file. ';
            messageText += finaliseResult.error;

        }

        summariseProgressBar.detail = messageText;

        setTimeout(() => {

            summariseProgressBar.close();
            summariseProgressBar = null;

            if (summariseWindow) {

                summariseWindow.send('summarise-summary-closed');

            }

        }, 5000);

    }

});

ipcMain.on('poll-summarise-cancelled', (event) => {

    if (summariseProgressBar) {

        event.returnValue = false;

    } else {

        event.returnValue = true;

    }

});

/* Update which amplitude threshold scale option is checked in menu */

ipcMain.on('set-amplitude-threshold-scale', (event, index) => {

    const menu = Menu.getApplicationMenu();

    const scaleMenuItems = [menu.getMenuItemById('scale0'), menu.getMenuItemById('scale1'), menu.getMenuItemById('scale2')];

    scaleMenuItems[index].checked = true;

});

/* Update which time zone option is checked in menu */

function updateTimeZoneMenuCheckbox () {

    const menu = Menu.getApplicationMenu();

    const timeZoneMenuItems = [menu.getMenuItemById('timeZone0'), menu.getMenuItemById('timeZone1'), menu.getMenuItemById('timeZone2')];

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
    const sunDefinitionRadioButtons = [menu.getMenuItemById('sun0'), menu.getMenuItemById('sun1'), menu.getMenuItemById('sun2'), menu.getMenuItemById('sun3')];

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
