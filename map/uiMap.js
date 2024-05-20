/****************************************************************************
 * uiMap.js
 * openacousticdevices.info
 * February 2024
 *****************************************************************************/

/* global L */
/* eslint-disable new-cap */

const electron = require('electron');

let map, marker;

function convertToCoordinateArray (l) {

    while (l > 180) l -= 360;
    while (l < -180) l += 360;

    l = Math.round(100 * l);

    const positiveDirection = l >= 0;

    l = Math.abs(l);

    const degrees = Math.floor(l / 100);
    const hundredths = l % 100;

    return [degrees, hundredths, positiveDirection];

}

electron.ipcRenderer.on('update-location-sub-window', (e, latArray, lonArray, changeZoom, newZoom) => {

    let lat = latArray[0] + latArray[1] / 100;

    if (latArray[2] === false) lat = -lat;

    let lon = lonArray[0] + lonArray[1] / 100;

    if (lonArray[2] === false) lon = -lon;

    marker.setLatLng([lat, lon]);

    if (changeZoom) {

        map.setView(L.latLng(lat, lon), newZoom);

    } else {

        map.setView(L.latLng(lat, lon));

    }

});

function updateMainWindow (latLng) {

    const latArray = convertToCoordinateArray(latLng.lat);
    const lonArray = convertToCoordinateArray(latLng.lng);

    electron.ipcRenderer.send('update-location-main-window', latArray, lonArray);

}

function setUpMap () {

    try {

        map = new L.Map('location-picker');

    } catch (e) {

        console.log(e);

    }

    const attributionElement = document.getElementsByClassName('leaflet-control-attribution')[0];
    attributionElement.innerHTML = '<span>Open Street Map</span>';

    map.doubleClickZoom.disable();

    map.on('dblclick', (e) => {

        const latLng = e.latlng;
        const zoom = Math.min(map.getZoom() + 1, map.getMaxZoom());

        console.log('Map marker moved to ' + latLng + ' zoom ' + zoom);

        marker.setLatLng(latLng);

        updateMainWindow(latLng);

        map.setView(latLng, zoom);

    });

    const osm = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 17, attribution: ''});

    const lat = 0;
    const lng = 0;

    map.addLayer(osm);

    if (!marker) {

        marker = new L.marker([lat, lng], {draggable: 'true'});

    } else {

        marker.setLatLng([lat, lng]);

    }

    marker.on('dragend', (e) => {

        const latLng = e.target.getLatLng();
        console.log('Map marker moved to ' + latLng);

        updateMainWindow(latLng);

        map.setView(latLng);

    });

    map.addLayer(marker);

}

setUpMap();
