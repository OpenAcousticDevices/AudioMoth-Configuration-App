'use strict';

/* global document */

const ui = require('./ui.js');

const dateInputs = document.getElementsByClassName('custom-date-input');

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

        input.style.border = '1px solid #0000ff';
        input.style.color = 'blue';

        setTimeout(() => {

            if (!input.disabled) {

                input.classList.remove('grey');

            }

            input.style.color = '';
            input.style.border = '';

        }, 1000);

    }

}

const today = new Date();
const todayString = ui.formatDateString(today);

for (let i = 0; i < dateInputs.length; i++) {

    dateInputs[i].addEventListener('focusout', handleFocusOut);

    setToLastValidDate(dateInputs[i], todayString);

    dateInputs[i].setAttribute('lastValidDate', dateInputs[i].value);

    dateInputs[i].setAttribute('min', todayString);
    dateInputs[i].setAttribute('max', '2029-12-31');

}
