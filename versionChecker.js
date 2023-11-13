/****************************************************************************
 * versionChecker.js
 * openacousticdevices.info
 * November 2020
 *****************************************************************************/

'use strict';

/* global XMLHttpRequest */

const {app} = require('@electron/remote');

const semver = require('semver');

const pjson = require('./package.json');

/* Check current app version in package.json against latest version in repository's releases */

exports.checkLatestRelease = (callback) => {

    /* Check for internet connection */

    if (!navigator.onLine) {

        callback({updateNeeded: false, error: 'No internet connection, failed to request app version information.'});
        return;

    }

    const version = app.getVersion();

    /* Transform repository URL into release API URL */

    const repoGitURL = pjson.repository.url;
    let repoURL = repoGitURL.replace('.git', '/releases');
    repoURL = repoURL.replace('github.com', 'api.github.com/repos');

    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', repoURL, true);

    xmlHttp.onload = () => {

        if (xmlHttp.status === 200) {

            const responseJson = JSON.parse(xmlHttp.responseText);

            const latestVersion = responseJson[0].tag_name;

            console.log('Comparing latest release (' + latestVersion + ') with currently installed version (' + version + ')');

            /* Compare current version in package.json to latest version pulled from Github */

            const updateNeeded = semver.lt(version, latestVersion);

            callback({updateNeeded, latestVersion: updateNeeded ? latestVersion : version});

        }

    };

    xmlHttp.onerror = () => {

        console.error('Failed to pull release information.');
        callback({updateNeeded: false, error: 'HTTP connection error, failed to request app version information.'});

    };

    /* Send request */

    xmlHttp.send(null);

};
