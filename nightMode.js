/****************************************************************************
 * nightMode.js
 * openacousticdevices.info
 * December 2019
 *****************************************************************************/

'use strict';

const electron = require('electron');

var nightMode = false;

exports.isEnabled = function () {

    return nightMode;

};

function setNightMode (nm) {

    var oldLink, newLink;

    nightMode = nm;

    oldLink = document.getElementById('uiCSS');

    newLink = document.createElement('link');

    newLink.setAttribute('id', 'uiCSS');
    newLink.setAttribute('rel', 'stylesheet');
    newLink.setAttribute('type', 'text/css');

    if (nightMode) {

        newLink.setAttribute('href', electron.remote.app.getAppPath() + '/uiNight.css');

    } else {

        newLink.setAttribute('href', electron.remote.app.getAppPath() + '/ui.css');

    }

    document.getElementsByTagName('head').item(0).replaceChild(newLink, oldLink);

}

exports.setNightMode = setNightMode;

exports.toggle = function () {

    setNightMode(!nightMode);

};
