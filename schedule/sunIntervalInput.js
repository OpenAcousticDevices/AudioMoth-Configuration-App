/****************************************************************************
 * sunIntervalInput.js
 * openacousticdevices.info
 * November 2023
 *****************************************************************************/

'use strict';

const DEFAULT_WIDTH = '60px';
const DEFAULT_HEIGHT = '25px';

const inputData = {};

function isAlternateImplementation (div) {

    return inputData[div.id].alternateImplementation;

}

exports.setEnabled = (div, setting) => {

    inputData[div.id].enabled = setting;

    const uiElements = getAllSpans(div);
    const textInput = getTextInput(div);

    if (setting) {

        textInput.style.backgroundColor = '';
        textInput.style.border = '';
        textInput.tabIndex = 0;

        for (let i = 0; i < uiElements.length; i++) {

            uiElements[i].classList.remove('grey');
            uiElements[i].style.backgroundColor = '';

        }

        updateGrey(div);

    } else {

        textInput.style.backgroundColor = 'EBEBE4';
        textInput.style.border = '1px solid #cccccc';

        for (let i = 0; i < uiElements.length; i++) {

            uiElements[i].classList.add('grey');
            uiElements[i].style.backgroundColor = 'EBEBE4';

        }

        textInput.tabIndex = -1;

    }

};

/**
 * @param {Element} div Parent div element
 * @returns Time string
 */
function getValue (div) {

    return inputData[div.id].value;

};

exports.getValue = getValue;

// Data structure setters

function setValue (div, value) {

    const maxValue = getMaxValue();

    inputData[div.id].value = Math.min(value, maxValue);

    updateFieldSpan(div);

    updateGrey(div);

}

exports.setValue = setValue;

function setSelectedIndex (div, index) {

    inputData[div.id].selectedIndex = index;

}

function setEntry (div, entry) {

    inputData[div.id].entry = entry;

}

function resetEntry (div) {

    inputData[div.id].entry = isAlternateImplementation(div) ? '' : 0;

}

// Data structure getters

function isEnabled (div) {

    return inputData[div.id].enabled;

}

function getSelectedIndex (div) {

    return inputData[div.id].selectedIndex;

}

function getEntry (div) {

    return inputData[div.id].entry;

}

function getWidth (div) {

    return inputData[div.id].width;

}

// Get UI elements

function getDurationSpan0 (div) {

    return div.getElementsByClassName('duration-span0')[0];

}

function getDurationSpan1 (div) {

    return div.getElementsByClassName('duration-span1')[0];

}

function getTextInput (div) {

    return div.getElementsByClassName('text-input')[0];

}

function getAllSpans (div) {

    const holder = div.getElementsByClassName('holder')[0];
    return holder.children;

}

// Update values

function getMaxValue () {

    return 360;

}

function updateFieldSpan (div) {

    const value = getValue(div);

    const field0 = getDurationSpan0(div);
    const field1 = getDurationSpan1(div);

    const stringValue = value.toString().padStart(3, '0');

    field0.innerText = stringValue.slice(0, 1);
    field1.innerText = stringValue.slice(1);

}

// Keypress event handler

function handleKeyDown (e) {

    const div = e.target.parentNode;

    if (e.key === 'Tab') {

        return;

    }

    e.preventDefault();

    if (e.key === 'ArrowUp') {

        resetEntry(div);

        const currentValue = getValue(div);
        const maxValue = getMaxValue();

        const newValue = currentValue + 1 > maxValue ? 0 : currentValue + 1;

        setValue(div, newValue);

        return;

    }

    if (e.key === 'ArrowDown') {

        resetEntry(div);

        const currentValue = getValue(div);
        const maxValue = getMaxValue();

        const newValue = currentValue - 1 < 0 ? maxValue : currentValue - 1;

        setValue(div, newValue);

        updateGrey(div);

        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        resetEntry(div);
        setValue(div, 0);

        updateGrey(div);

        return;

    }

    const patt = /^[0-9]$/;

    if (patt.test(e.key)) {

        const digit = parseInt(e.key);

        let entry = getEntry(div);

        if (isAlternateImplementation(div)) {

            setEntry(div, entry + digit);
            entry = getEntry(div);

            const maxValue = getMaxValue(div);
            const value = Math.min(maxValue, parseInt(entry));

            setValue(div, value);

            const width = getWidth(div);

            if (10 * value > maxValue || (maxValue === 0 && digit > 0) || entry.length === width) {

                resetEntry(div);

            }

        } else {

            setEntry(div, 10 * entry + digit);
            entry = getEntry(div);

            const maxValue = getMaxValue(div);
            const value = Math.min(maxValue, entry);

            setValue(div, value);

            if (10 * value > maxValue || (maxValue === 0 && digit > 0)) {

                resetEntry(div);

            }

        }

    }

}

/**
 * Highlight the span at index selectedIndex
 * @param {Element} div Time input div element
 */
function highlightInput (div) {

    const inputNode = getTextInput(div);

    const index = getSelectedIndex(div);

    const durationSpan0 = getDurationSpan0(div);
    const durationSpan1 = getDurationSpan1(div);

    const deselectedColor = inputNode.style.background;

    if (index === 0) {

        durationSpan0.style.color = '';
        durationSpan0.style.backgroundColor = 'Highlight';
        durationSpan0.style.color = 'HighlightText';
        durationSpan1.style.color = '';
        durationSpan1.style.backgroundColor = 'Highlight';
        durationSpan1.style.color = 'HighlightText';

    } else {

        durationSpan0.style.color = '';
        durationSpan0.style.backgroundColor = deselectedColor;
        durationSpan0.classList.remove('grey');
        durationSpan1.style.color = '';
        durationSpan1.style.backgroundColor = deselectedColor;
        durationSpan1.classList.remove('grey');

    }

    updateGrey(div);

}

function updateGrey (div) {

    if (!isEnabled(div)) {

        return;

    }

    // Update grey

    const durationSpanNode0 = getDurationSpan0(div);
    const durationSpanNode1 = getDurationSpan1(div);

    const inputValue = getValue(div);

    if (inputValue < 10) {

        durationSpanNode0.classList.add('allGrey');
        durationSpanNode1.classList.add('greyStart');

    } else if (inputValue < 100) {

        durationSpanNode0.classList.add('allGrey');
        durationSpanNode1.classList.remove('greyStart');

    } else {

        durationSpanNode0.classList.remove('allGrey');
        durationSpanNode1.classList.remove('greyStart');

    }

    const selectedIndex = getSelectedIndex(div);

    if (selectedIndex === 0) {

        durationSpanNode0.classList.remove('allGrey');
        durationSpanNode1.classList.remove('greyStart');

    }

}

/**
 * Create all the UI elements needed and add a new data structure to the lookup table
 * @param {string} divName Name assigned to custom div
 * @param {boolean} alternateImplementation Whether or not to use alternate implementation which allows leading zeroes
 * @param {function} focusOutFunction Function run when focus leaves input
 * @returns Parent div element
 */
exports.create = (divName, alternateImplementation, focusOutFunction) => {

    const customDiv = document.getElementById(divName);

    let width, height;

    const attributes = customDiv.attributes;

    width = customDiv.style.width;
    width = (width === '') ? DEFAULT_WIDTH : width;
    height = customDiv.style.height;
    height = (height === '') ? DEFAULT_HEIGHT : height;

    const parent = customDiv.parentNode;

    const id = customDiv.id;

    parent.removeChild(customDiv);

    const div = document.createElement('div');
    div.style = 'position: relative;';
    div.id = id;

    for (let i = 0; i < attributes.length; i++) {

        if (attributes[i].name !== 'style') {

            div.setAttribute(attributes[i].name, attributes[i].value);

        }

    }

    const numSpanStyle1 = 'display: inline-block; text-align: center; width: 7px;';
    const numSpanStyle2 = 'display: inline-block; text-align: center; width: 15px;';

    const inputNode = document.createElement('input');
    inputNode.className = 'text-input';
    inputNode.type = 'text';
    inputNode.style = 'width: ' + width + '; height: ' + height + '; color: white; caret-color: transparent;';

    div.appendChild(inputNode);

    const blockerNode = document.createElement('div');
    blockerNode.style = 'position: absolute; top: 0px; margin-left: 0px; margin-top: 0px; width: 100%; height: 100%;';

    const holderNode = document.createElement('div');
    holderNode.className = 'holder';
    holderNode.style = 'position: absolute; top: 0px; margin-left: 32px; margin-top: 3px;';

    const durationSpanNode0 = document.createElement('span');
    durationSpanNode0.className = 'duration-span0';
    durationSpanNode0.innerText = '0';
    durationSpanNode0.style = numSpanStyle1;

    const durationSpanNode1 = document.createElement('span');
    durationSpanNode1.className = 'duration-span1';
    durationSpanNode1.innerText = '00';
    durationSpanNode1.style = numSpanStyle2;

    holderNode.appendChild(durationSpanNode0);
    holderNode.appendChild(durationSpanNode1);

    blockerNode.appendChild(holderNode);
    div.appendChild(blockerNode);

    parent.appendChild(div);

    const data = {};

    alternateImplementation = alternateImplementation === undefined ? false : alternateImplementation;

    data.alternateImplementation = alternateImplementation;
    data.value = 0;
    data.width = 3;
    data.selectedIndex = -1;
    data.entry = alternateImplementation ? '0' : 0;
    data.enabled = true;

    inputData[div.id] = data;

    updateGrey(div);

    inputNode.addEventListener('keydown', handleKeyDown);

    function handleSpanClick () {

        if (!isEnabled(div)) {

            return;

        }

        setSelectedIndex(div, 0);
        highlightInput(div);
        inputNode.focus();

        updateGrey(div);

    }

    durationSpanNode0.addEventListener('click', handleSpanClick);
    durationSpanNode1.addEventListener('click', handleSpanClick);

    inputNode.addEventListener('focusin', () => {

        if (!isEnabled(div)) {

            inputNode.blur();
            return;

        }

        resetEntry(div);

        if (getSelectedIndex(div) === -1) {

            setSelectedIndex(div, 0);
            highlightInput(div);

        }

        updateGrey(div);

    });

    inputNode.addEventListener('focusout', () => {

        if (!isEnabled(div)) {

            return;

        }

        setSelectedIndex(div, -1);
        highlightInput(div);

        updateGrey(div);

        if (focusOutFunction) {

            focusOutFunction();

        }

    });

    inputNode.addEventListener('click', () => {

        if (!isEnabled(div)) {

            return;

        }

        setSelectedIndex(div, 0);
        highlightInput(div);
        inputNode.focus();

    });

    return div;

};
