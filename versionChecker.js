/****************************************************************************
 * versionChecker.js
 * openacousticdevices.info
 * November 2020
 *****************************************************************************/

'use strict';

/* global XMLHttpRequest */

const electron = require('electron');

var pjson = require('./package.json');

/* Compare two semantic versions and return true if older */

function isOlderSemanticVersion (aVersion, bVersion) {

    var aVersionNum, bVersionNum;

    for (let i = 0; i < aVersion.length; i++) {

        aVersionNum = aVersion[i];
        bVersionNum = bVersion[i];

        if (aVersionNum > bVersionNum) {

            return false;

        } else if (aVersionNum < bVersionNum) {

            return true;

        }

    }

    return false;

}

/* Check current app version in package.json against latest version in repository's releases */

exports.checkLatestRelease = function (callback) {

    var version, repoGitURL, repoURL, xmlHttp, responseJson, latestVersion, updateNeeded;

    /* Check for internet connection */

    if (!navigator.onLine) {

        callback({updateNeeded: false, error: 'No internet connection, failed to request app version information.'});
        return;

    }

    version = electron.remote.app.getVersion();

    /* Transform repository URL into release API URL */

    repoGitURL = pjson.repository.url;
    repoURL = repoGitURL.replace('.git', '/releases');
    repoURL = repoURL.replace('github.com', 'api.github.com/repos');

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', repoURL, true);

    xmlHttp.onload = function () {

        if (xmlHttp.status === 200) {

            responseJson = JSON.parse(xmlHttp.responseText);

            latestVersion = responseJson[0].tag_name;

            console.log('Comparing latest release (' + latestVersion + ') with currently installed version (' + version + ')');

            /* Compare current version in package.json to latest version pulled from Github */

            updateNeeded = isOlderSemanticVersion(version, latestVersion);

            callback({updateNeeded: updateNeeded, latestVersion: updateNeeded ? latestVersion : version});

        }

    };

    xmlHttp.onerror = function () {

        console.error('Failed to pull release information.');
        callback({updateNeeded: false, error: 'HTTP connection error, failed to request app version information.'});

    };

    /* Send request */

    xmlHttp.send(null);

};
