'use strict';

/* global document */

var dateInputs = document.getElementsByClassName('custom-date-input');

function dateToUTCString (date) {

    var year, month, day;

    year = ('000' + date.getUTCFullYear()).slice(-4);
    month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    day = ('0' + date.getUTCDate()).slice(-2);
    return year + '-' + month + '-' + day;

}

exports.updateLocalTimeStatus = function (input, isLocalTime) {

    var today, todayYear, todayMonth, todayDay, dayDiff, currentDate, lastValidDate;

    today = new Date();

    dayDiff = today.getDate() - today.getUTCDate();

    lastValidDate = new Date(input.getAttribute('lastValidDate'));

    if (isLocalTime) {

        todayYear = ('000' + today.getFullYear()).slice(-4);
        todayMonth = ('0' + (today.getMonth() + 1)).slice(-2);
        todayDay = ('0' + today.getDate()).slice(-2);

        currentDate = new Date(input.value);
        currentDate.setDate(currentDate.getDate() + dayDiff);

        lastValidDate.setDate(lastValidDate.getDate() + dayDiff);

    } else {

        todayYear = ('000' + today.getUTCFullYear()).slice(-4);
        todayMonth = ('0' + (today.getUTCMonth() + 1)).slice(-2);
        todayDay = ('0' + today.getUTCDate()).slice(-2);

        currentDate = new Date(input.value);
        currentDate.setDate(currentDate.getDate() - dayDiff);

        lastValidDate.setDate(lastValidDate.getDate() - dayDiff);

    }

    input.value = dateToUTCString(currentDate);
    input.setAttribute('min', todayYear + '-' + todayMonth + '-' + todayDay);
    input.setAttribute('lastValidDate', dateToUTCString(lastValidDate));

};

function isValidDate (input, d) {

    var maxDate, minDate;

    if (!(d instanceof Date)) {

        return false;

    }

    if (isNaN(d)) {

        return false;

    }

    maxDate = new Date(input.getAttribute('max'));

    if (d > maxDate.getTime()) {

        return false;

    }

    minDate = new Date(input.getAttribute('min'));

    if (d.getTime() < minDate.getTime()) {

        return false;

    }

    return true;

}

function setToLastValidDate (input, lastValidDateString) {

    input.value = lastValidDateString;

}

function handleFocusOut (e) {

    var input, inputDate;

    input = e.srcElement;

    inputDate = new Date(input.value);

    if (isValidDate(input, inputDate)) {

        input.setAttribute('lastValidDate', input.value);

    } else {

        setToLastValidDate(input, input.getAttribute('lastValidDate'));

        input.style.border = '2px solid #0000ff';
        input.style.color = 'blue';

        setTimeout(function () {

            if (!input.disabled) {

                input.style.color = '';

            }

            input.style.border = '';

        }, 1000);

    }

}

var year, month, day, today;

today = new Date();

year = ('000' + today.getUTCFullYear()).slice(-4);
month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
day = ('0' + today.getUTCDate()).slice(-2);
today = year + '-' + month + '-' + day;

for (let i = 0; i < dateInputs.length; i++) {

    dateInputs[i].addEventListener('focusout', handleFocusOut);

    setToLastValidDate(dateInputs[i], today);

    dateInputs[i].setAttribute('lastValidDate', dateInputs[i].value);

    dateInputs[i].setAttribute('min', today);
    dateInputs[i].setAttribute('max', '2029-12-31');

}
