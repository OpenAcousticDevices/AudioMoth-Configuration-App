'use strict';

/* global document */

const dateInputs = document.getElementsByClassName('custom-date-input');

function dateToUTCString (date) {

    const year = ('000' + date.getUTCFullYear()).slice(-4);
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    return year + '-' + month + '-' + day;

}

exports.updateLocalTimeStatus = (input, isLocalTime) => {

    let todayYear, todayMonth, todayDay, currentDate;

    const today = new Date();

    const dayDiff = today.getDate() - today.getUTCDate();

    const lastValidDate = new Date(input.getAttribute('lastValidDate'));

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

    if (!(d instanceof Date)) {

        return false;

    }

    if (isNaN(d)) {

        return false;

    }

    const maxDate = new Date(input.getAttribute('max'));

    if (d > maxDate.getTime()) {

        return false;

    }

    const minDate = new Date(input.getAttribute('min'));

    if (d.getTime() < minDate.getTime()) {

        return false;

    }

    return true;

}

function setToLastValidDate (input, lastValidDateString) {

    input.value = lastValidDateString;

}

function handleFocusOut (e) {

    const input = e.srcElement;

    const inputDate = new Date(input.value);

    if (isValidDate(input, inputDate)) {

        input.setAttribute('lastValidDate', input.value);

    } else {

        setToLastValidDate(input, input.getAttribute('lastValidDate'));

        input.style.border = '2px solid #0000ff';
        input.style.color = 'blue';

        setTimeout(function () {

            if (!input.disabled) {

                input.classList.remove('grey');

            }

            input.style.color = '';
            input.style.border = '';

        }, 1000);

    }

}

const today = new Date();

const year = ('000' + today.getUTCFullYear()).slice(-4);
const month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
const day = ('0' + today.getUTCDate()).slice(-2);
const todayString = year + '-' + month + '-' + day;

for (let i = 0; i < dateInputs.length; i++) {

    dateInputs[i].addEventListener('focusout', handleFocusOut);

    setToLastValidDate(dateInputs[i], todayString);

    dateInputs[i].setAttribute('lastValidDate', dateInputs[i].value);

    dateInputs[i].setAttribute('min', todayString);
    dateInputs[i].setAttribute('max', '2029-12-31');

}
