/****************************************************************************
 * main.js
 * openacousticdevices.info
 * August 2019
 *****************************************************************************/

'use strict';

const electron = require('electron');

const app = electron.app;

const Menu = electron.Menu;

const shell = electron.shell;

const ipcMain = electron.ipcMain;

const path = require('path');

const BrowserWindow = electron.BrowserWindow;

const ProgressBar = require('electron-progressbar');

require('electron-debug')({
    showDevTools: true,
    devToolsMode: 'undocked'
});

var mainWindow, aboutWindow, expansionWindow, splitWindow, downsampleWindow;

var expandProgressBar, splitProgressBar, downsampleProgressBar;

function shrinkWindowHeight (windowHeight) {

    if (process.platform === 'darwin') {

        windowHeight -= 20;

    } else if (process.platform === 'linux') {

        windowHeight -= 20;

    }

    return windowHeight;

}

function openSplitWindow () {

    if (splitWindow) {

        return;

    }

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';

    splitWindow = new BrowserWindow({
        width: 565,
        height: shrinkWindowHeight(468),
        title: 'Split AudioMoth WAV Files',
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    splitWindow.setMenu(null);
    splitWindow.loadURL(path.join('file://', __dirname, 'processing/split.html'));

    splitWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (splitWindow) {

            splitWindow.webContents.send('night-mode', nightMode);

        }

    });

    splitWindow.on('close', function (e) {

        if (splitProgressBar) {

            e.preventDefault();

        }

        splitWindow = null;

    });

}

function openExpansionWindow () {

    if (expansionWindow) {

        return;

    }

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';

    expansionWindow = new BrowserWindow({
        width: 565,
        height: shrinkWindowHeight(643),
        title: 'Expand AudioMoth T.WAV Files',
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    expansionWindow.setMenu(null);
    expansionWindow.loadURL(path.join('file://', __dirname, 'processing/expansion.html'));

    expansionWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (expansionWindow) {

            expansionWindow.webContents.send('night-mode', nightMode);

        }

    });

    expansionWindow.on('close', function (e) {

        if (expandProgressBar) {

            e.preventDefault();

        }

        expansionWindow = null;

    });

}

function openDownsamplingWindow () {

    if (downsampleWindow) {

        return;

    }

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';

    downsampleWindow = new BrowserWindow({
        width: 565,
        height: shrinkWindowHeight(448),
        title: 'Downsample AudioMoth WAV Files',
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    downsampleWindow.setMenu(null);
    downsampleWindow.loadURL(path.join('file://', __dirname, 'processing/downsampling.html'));

    downsampleWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (downsampleWindow) {

            downsampleWindow.webContents.send('night-mode', nightMode);

        }

    });

    downsampleWindow.on('close', function (e) {

        if (downsampleProgressBar) {

            e.preventDefault();

        }

        downsampleWindow = null;

    });

}

function openAboutWindow () {

    if (aboutWindow) {

        return;

    }

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';

    aboutWindow = new BrowserWindow({
        width: 400,
        height: shrinkWindowHeight(340),
        title: 'About',
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true
        }
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(path.join('file://', __dirname, '/about.html'));

    aboutWindow.on('close', function () {

        aboutWindow = null;

    });

    aboutWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (aboutWindow) {

            aboutWindow.webContents.send('night-mode', nightMode);

        }

    });

}

function toggleNightMode () {

    mainWindow.webContents.send('night-mode');

    if (splitWindow) {

        splitWindow.webContents.send('night-mode');

    }

    if (expansionWindow) {

        expansionWindow.webContents.send('night-mode');

    }

    if (downsampleWindow) {

        downsampleWindow.webContents.send('night-mode');

    }

    if (aboutWindow) {

        aboutWindow.webContents.send('night-mode');

    }

}

app.on('ready', function () {

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';
    const windowHeight = shrinkWindowHeight(665);

    mainWindow = new BrowserWindow({
        title: 'AudioMoth Configuration App',
        width: 565,
        height: windowHeight,
        useContentSize: true,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.on('restore', function () {

        /* When minimised and restored, Windows platforms alter the BrowserWindow such that the height no longer includes the menu bar */
        /* This resize cannot be blocked so this fix resizes it, taking into account the menu change */
        if (process.platform === 'win32') {

            mainWindow.setSize(565, windowHeight + 20);

        }

    });

    const menuTemplate = [{
        label: 'File',
        submenu: [{
            label: 'Open Configuration',
            accelerator: 'CommandOrControl+O',
            click: function () {

                mainWindow.webContents.send('load');

            }
        }, {
            label: 'Save Configuration',
            accelerator: 'CommandOrControl+S',
            click: function () {

                mainWindow.webContents.send('save');

            }
        }, {
            type: 'separator'
        }, {
            id: 'copyid',
            label: 'Copy Device ID',
            accelerator: 'CommandOrControl+I',
            click: function () {

                mainWindow.webContents.send('copy-id');

            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            type: 'checkbox',
            id: 'localTime',
            label: 'Local Time',
            accelerator: 'CommandOrControl+T',
            checked: false,
            click: function () {

                mainWindow.webContents.send('local-time');
                mainWindow.webContents.send('local-time-schedule');

            }
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
            click: function () {

                mainWindow.webContents.send('amplitude-threshold-scale', 1);

            }
        }, {
            type: 'radio',
            id: 'scale2',
            label: 'Decibel Amplitude Threshold Scale',
            checked: false,
            click: function () {

                mainWindow.webContents.send('amplitude-threshold-scale', 2);

            }
        }, {
            type: 'radio',
            id: 'scale0',
            label: 'Percentage Amplitude Threshold Scale',
            checked: true,
            click: function () {

                mainWindow.webContents.send('amplitude-threshold-scale', 0);

            }
        }, {
            type: 'separator'
        }, {
            label: 'Split AudioMoth WAV Files',
            accelerator: 'CommandOrControl+P',
            click: function () {

                openSplitWindow();

            }
        }, {
            label: 'Expand AudioMoth T.WAV Files',
            accelerator: 'CommandOrControl+E',
            click: function () {

                openExpansionWindow();

            }
        }, {
            label: 'Downsample AudioMoth WAV Files',
            accelerator: 'CommandOrControl+D',
            click: function () {

                openDownsamplingWindow();

            }
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'CommandOrControl+Q',
            click: function () {

                app.quit();

            }
        }]
    }, {
        label: 'Help',
        submenu: [{
            label: 'About',
            click: function () {

                openAboutWindow();

            }
        }, {
            label: 'Check For Updates',
            click: function () {

                mainWindow.webContents.send('update-check');

            }
        }, {
            type: 'separator'
        }, {
            label: 'AudioMoth Filter Playground',
            click: function () {

                shell.openExternal('https://playground.openacousticdevices.info/');

            }
        }, {
            type: 'separator'
        }, {
            label: 'Open Acoustic Devices Website',
            click: function () {

                shell.openExternal('https://openacousticdevices.info');

            }
        }]
    }];

    const menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

});

app.on('window-all-closed', function () {

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

    expandProgressBar = new ProgressBar({
        title: 'AudioMoth Configuration App',
        text: 'Expanding files...',
        detail: detail,
        closeOnComplete: false,
        indeterminate: false,
        browserWindow: {
            parent: expansionWindow,
            webPreferences: {
                nodeIntegration: true
            },
            closable: true,
            modal: false
        },
        maxValue: fileCount * 100
    });

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

    const index = fileNum + 1;
    const fileCount = expandProgressBar.getOptions().maxValue / 100;

    if (expandProgressBar) {

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

        setTimeout(function () {

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

    splitProgressBar = new ProgressBar({
        title: 'AudioMoth Configuration App',
        text: 'Splitting files...',
        detail: detail,
        closeOnComplete: false,
        indeterminate: false,
        browserWindow: {
            parent: splitWindow,
            webPreferences: {
                nodeIntegration: true
            },
            closable: true,
            modal: false
        },
        maxValue: fileCount * 100
    });

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

    const index = fileNum + 1;
    const fileCount = splitProgressBar.getOptions().maxValue / 100;

    if (splitProgressBar) {

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

        setTimeout(function () {

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

    downsampleProgressBar = new ProgressBar({
        title: 'AudioMoth Configuration App',
        text: 'Downsampling files...',
        detail: detail,
        closeOnComplete: false,
        indeterminate: false,
        browserWindow: {
            parent: splitWindow,
            webPreferences: {
                nodeIntegration: true
            },
            closable: true,
            modal: false
        },
        maxValue: fileCount * 100
    });

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

    const index = fileNum + 1;
    const fileCount = downsampleProgressBar.getOptions().maxValue / 100;

    if (downsampleProgressBar) {

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

        setTimeout(function () {

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

/* Update which amplitude threshold scale option is checked in menu */

ipcMain.on('set-amplitude-threshold-scale', (event, index) => {

    const menu = Menu.getApplicationMenu();

    const scaleMenuItems = [menu.getMenuItemById('scale0'), menu.getMenuItemById('scale1'), menu.getMenuItemById('scale2')];

    scaleMenuItems[index].checked = true;

});
