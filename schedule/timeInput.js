/****************************************************************************
 * timeInput.js
 * openacousticdevices.info
 * November 2023
 *****************************************************************************/

'use strict';

const DEFAULT_WIDTH = '50px';
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
exports.getValue = (div) => {

    const values = inputData[div.id].values;
    return values[0] + ':' + values[1];

};

function getSelectedValue (div) {

    const selectedIndex = getSelectedIndex(div);
    return getInputValues(div)[selectedIndex];

}

// Data structure setters

exports.setNextElements = (div, elements) => {

    inputData[div.id].nextElements = elements;

};

function setValue (div, hours, mins) {

    inputData[div.id].values = [hours, mins];

    updateFieldSpan(div, 0);
    updateFieldSpan(div, 1);

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

function updateFieldValue (div, index, value) {

    const inputValues = getInputValues(div);

    inputValues[index] = value;
    setValue(div, inputValues[0], inputValues[1]);

}

// Data structure getters

function getNextElements (div) {

    return inputData[div.id].nextElements;

}

function isEnabled (div) {

    return inputData[div.id].enabled;

}

function getSelectedIndex (div) {

    return inputData[div.id].selectedIndex;

}

function getEntry (div) {

    return inputData[div.id].entry;

}

function getFieldCount (div) {

    return inputData[div.id].values.length;

}

function getInputValues (div) {

    return inputData[div.id].values;

}

function getFields (div) {

    return inputData[div.id].fields;

}

function getWidth (div, index) {

    return inputData[div.id].widths[index];

}

// Get UI elements

function getHourSpan (div) {

    return div.getElementsByClassName('hour-span')[0];

}

function getMinuteSpan (div) {

    return div.getElementsByClassName('minute-span')[0];

}

function getTextInput (div) {

    return div.getElementsByClassName('text-input')[0];

}

exports.getTextInput = getTextInput;

function getAllSpans (div) {

    const holder = div.getElementsByClassName('holder')[0];
    return holder.children;

}

// Navigate between fields

function nextSelection (div) {

    const currentSelectedIndex = getSelectedIndex(div);

    const fieldCount = getFieldCount(div);

    const newSelectedIndex = (currentSelectedIndex + 1 >= fieldCount) ? fieldCount - 1 : currentSelectedIndex + 1;

    setSelectedIndex(div, newSelectedIndex);
    highlightInput(div);
    resetEntry(div);

}

function previousSelection (div) {

    const currentSelectedIndex = getSelectedIndex(div);

    const newSelectedIndex = (currentSelectedIndex - 1 < 0) ? 0 : currentSelectedIndex - 1;

    setSelectedIndex(div, newSelectedIndex);
    highlightInput(div);
    resetEntry(div);

}

// Update values

function getMaxValue (div) {

    let maxValue;

    const selectedIndex = getSelectedIndex(div);
    const inputValues = getInputValues(div);

    if (selectedIndex === 0) {

        maxValue = 24;

        if (inputValues[1] > 0) {

            maxValue = 23;

        }

    } else {

        maxValue = 59;

        if (inputValues[0] === 24) {

            maxValue = 0;

        }

    }

    return maxValue;

}

function updateFieldSpan (div, index) {

    const value = getInputValues(div)[index];

    const fields = getFields(div);
    const fieldName = fields[index];
    const field = div.getElementsByClassName(fieldName)[0];

    field.innerText = value < 10 ? '0' + value.toString() : value.toString();

}

// Keypress event handler

function handleKeyDown (e) {

    const div = e.target.parentNode;

    let selectedIndex = getSelectedIndex(div);

    if (e.key === 'Tab') {

        if (e.shiftKey) {

            setSelectedIndex(div, selectedIndex - 1);
            selectedIndex = getSelectedIndex(div);

            if (selectedIndex > -1) {

                e.preventDefault();

            } else {

                setSelectedIndex(div, -1);

            }

        } else {

            setSelectedIndex(div, selectedIndex + 1);
            selectedIndex = getSelectedIndex(div);

            const fieldCount = getFieldCount(div);

            if (selectedIndex < fieldCount) {

                e.preventDefault();

            } else {

                setSelectedIndex(div, -1);

            }

        }

        highlightInput(div);

        resetEntry(div);

        return;

    }

    e.preventDefault();

    if (e.key === 'ArrowRight') {

        nextSelection(div);
        return;

    }

    if (e.key === 'ArrowLeft') {

        previousSelection(div);
        return;

    }

    if (e.key === 'ArrowUp') {

        resetEntry(div);

        const currentValue = getSelectedValue(div);
        const maxValue = getMaxValue(div);

        const newValue = currentValue + 1 > maxValue ? 0 : currentValue + 1;

        updateFieldValue(div, selectedIndex, newValue);
        updateFieldSpan(div, selectedIndex);

        return;

    }

    if (e.key === 'ArrowDown') {

        resetEntry(div);

        const currentValue = getSelectedValue(div);
        const maxValue = getMaxValue(div);

        const newValue = currentValue - 1 < 0 ? maxValue : currentValue - 1;

        updateFieldValue(div, selectedIndex, newValue);
        updateFieldSpan(div, selectedIndex);

        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        selectedIndex = getSelectedIndex(div);

        resetEntry(div);
        updateFieldValue(div, selectedIndex, 0);
        updateFieldSpan(div, selectedIndex);

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

            updateFieldValue(div, selectedIndex, value);
            updateFieldSpan(div, selectedIndex);

            const width = getWidth(div, selectedIndex);

            if (10 * value > maxValue || (maxValue === 0 && digit > 0) || entry.length === width) {

                nextSelection(div);

            }

        } else {

            setEntry(div, 10 * entry + digit);
            entry = getEntry(div);

            const maxValue = getMaxValue(div);
            const value = Math.min(maxValue, entry);

            updateFieldValue(div, selectedIndex, value);
            updateFieldSpan(div, selectedIndex);

            if (10 * value > maxValue || (maxValue === 0 && digit > 0)) {

                nextSelection(div);

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

    const hourSpan = getHourSpan(div);
    const minuteSpan = getMinuteSpan(div);

    const deselectedColor = inputNode.style.background;

    if (index === 0) {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        hourSpan.style.backgroundColor = 'Highlight';
        hourSpan.style.color = 'HighlightText';
        minuteSpan.style.backgroundColor = deselectedColor;
        minuteSpan.classList.remove('grey');

    } else if (index === 1) {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        hourSpan.style.backgroundColor = deselectedColor;
        hourSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = 'Highlight';
        minuteSpan.style.color = 'HighlightText';

    } else {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        hourSpan.style.backgroundColor = deselectedColor;
        hourSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = deselectedColor;
        minuteSpan.classList.remove('grey');

    }

}

/**
 * Create all the UI elements needed and add a new data structure to the lookup table
 * @param {string} divName Name assigned to custom div
 * @param {boolean} alternateImplementation Whether or not to use alternate implementation which allows leading zeroes
 * @returns Parent div element
 */
exports.create = (divName, alternateImplementation) => {

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

    const inputNode = document.createElement('input');
    inputNode.className = 'text-input';
    inputNode.type = 'text';
    inputNode.style = 'width: ' + width + '; height: ' + height + '; color: white; caret-color: transparent;';

    div.appendChild(inputNode);

    const blockerNode = document.createElement('div');
    blockerNode.style = 'position: absolute; top: 0px; margin-left: 0px; margin-top: 0px; width: 100%; height: 100%;';

    const holderNode = document.createElement('div');
    holderNode.className = 'holder';
    holderNode.style = 'position: absolute; top: 0px; margin-left: 9px; margin-top: 3px;';

    const hourSpanNode = document.createElement('span');
    hourSpanNode.className = 'hour-span';
    hourSpanNode.innerText = '00';
    hourSpanNode.style = 'display: inline-block; width: 15px;';

    const colonSpanNode = document.createElement('span');
    colonSpanNode.className = 'colon-span';
    colonSpanNode.innerText = ':';
    colonSpanNode.style = 'display: inline-block; width: 6px; text-align: center;';

    const minuteSpanNode = document.createElement('span');
    minuteSpanNode.className = 'minute-span';
    minuteSpanNode.innerText = '00';
    minuteSpanNode.style = 'display: inline-block; width: 15px;';

    holderNode.appendChild(hourSpanNode);
    holderNode.appendChild(colonSpanNode);
    holderNode.appendChild(minuteSpanNode);

    blockerNode.appendChild(holderNode);
    div.appendChild(blockerNode);

    parent.appendChild(div);

    const data = {};

    alternateImplementation = alternateImplementation === undefined ? false : alternateImplementation;

    data.alternateImplementation = alternateImplementation;
    data.values = [0, 0];
    data.widths = [2, 2];
    data.selectedIndex = -1;
    data.entry = alternateImplementation ? '0' : 0;
    data.enabled = true;
    data.fields = [hourSpanNode.className, minuteSpanNode.className];
    data.nextElements = [];

    inputData[div.id] = data;

    inputNode.addEventListener('keydown', handleKeyDown);

    function handleSpanClick (index) {

        if (!isEnabled(div)) {

            return;

        }

        setSelectedIndex(div, index);
        highlightInput(div);
        inputNode.focus();

    }

    hourSpanNode.addEventListener('click', () => {

        handleSpanClick(0);

    });

    minuteSpanNode.addEventListener('click', () => {

        handleSpanClick(1);

    });

    inputNode.addEventListener('focusin', (e) => {

        if (!isEnabled(div)) {

            inputNode.blur();
            return;

        }

        resetEntry(div);

        const nextElements = getNextElements(div);

        for (let i = 0; i < nextElements.length; i++) {

            if (e.relatedTarget === nextElements[i]) {

                setSelectedIndex(div, 1);
                highlightInput(div);
                break;

            }

        }

        if (getSelectedIndex(div) === -1) {

            setSelectedIndex(div, 0);
            highlightInput(div);

        }

    });

    inputNode.addEventListener('focusout', () => {

        if (!isEnabled(div)) {

            return;

        }

        setSelectedIndex(div, -1);
        highlightInput(div);

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
