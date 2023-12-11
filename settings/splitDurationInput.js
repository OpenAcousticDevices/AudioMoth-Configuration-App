/****************************************************************************
 * splitDurationInput.js
 * openacousticdevices.info
 * November 2023
 *****************************************************************************/

'use strict';

const DEFAULT_WIDTH = '70px';
const DEFAULT_HEIGHT = '25px';

// 12 hours in seconds
const MAX_SECONDS = 43200;

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

    const values = inputData[div.id].values;
    const hours = values[0];
    const mins = values[1];
    const secs = values[2];

    return (hours * 60 * 60) + (mins * 60) + secs;

}

exports.getValue = getValue;

function getSelectedValue (div) {

    const selectedIndex = getSelectedIndex(div);
    return getInputValues(div)[selectedIndex];

}

// Data structure setters

exports.setNextElements = (div, elements) => {

    inputData[div.id].nextElements = elements;

};

function setValue (div, hours, minutes, seconds) {

    inputData[div.id].values = [hours, minutes, seconds];

    updateFieldSpan(div, 0);
    updateFieldSpan(div, 1);
    updateFieldSpan(div, 2);

    updateGrey(div);

}

function setTotalValue (div, seconds) {

    if (seconds < 0 || seconds > MAX_SECONDS) {

        return;

    }

    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    setValue(div, hours, minutes, seconds);

}

exports.setTotalValue = setTotalValue;

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
    setValue(div, inputValues[0], inputValues[1], inputValues[2]);

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

function getSecondSpan (div) {

    return div.getElementsByClassName('second-span')[0];

}

function getTextInput (div) {

    return div.getElementsByClassName('text-input')[0];

}

exports.getTextInput = getTextInput;

function getColonSpan1 (node) {

    return node.getElementsByClassName('colon-span1')[0];

}

function getColonSpan2 (node) {

    return node.getElementsByClassName('colon-span2')[0];

}

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

        maxValue = 12;

        if (inputValues[1] > 0 || inputValues[2] > 0) {

            maxValue = 11;

        }

    } else if (selectedIndex === 1) {

        maxValue = 59;

        if (inputValues[0] === 12) {

            maxValue = 0;

        }

    } else if (selectedIndex === 2) {

        maxValue = 59;

        if (inputValues[0] === 12) {

            maxValue = 0;

        }

    }

    return maxValue;

}

function updateFieldSpan (div, index) {

    const inputValues = getInputValues(div);
    const value = inputValues[index];

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

        updateGrey(div);

        return;

    }

    e.preventDefault();

    if (e.key === 'ArrowRight') {

        nextSelection(div);
        updateGrey(div);
        return;

    }

    if (e.key === 'ArrowLeft') {

        previousSelection(div);
        updateGrey(div);
        return;

    }

    if (e.key === 'ArrowUp') {

        resetEntry(div);

        const currentValue = getSelectedValue(div);
        const maxValue = getMaxValue(div);

        const newValue = currentValue + 1 > maxValue ? 0 : currentValue + 1;

        updateFieldValue(div, selectedIndex, newValue);
        updateFieldSpan(div, selectedIndex);

        updateGrey(div);

        return;

    }

    if (e.key === 'ArrowDown') {

        resetEntry(div);

        const currentValue = getSelectedValue(div);
        const maxValue = getMaxValue(div);

        const newValue = currentValue - 1 < 0 ? maxValue : currentValue - 1;

        updateFieldValue(div, selectedIndex, newValue);
        updateFieldSpan(div, selectedIndex);

        updateGrey(div);

        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        selectedIndex = getSelectedIndex(div);

        resetEntry(div);
        updateFieldValue(div, selectedIndex, 0);
        updateFieldSpan(div, selectedIndex);

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

function updateGrey (div) {

    if (!isEnabled(div)) {

        return;

    }

    // Update grey

    const hourSpanNode = getHourSpan(div);
    const colonSpan1 = getColonSpan1(div);
    const minuteSpanNode = getMinuteSpan(div);
    const colonSpan2 = getColonSpan2(div);
    const secondSpanNode = getSecondSpan(div);

    const inputValues = getInputValues(div);
    const hours = parseInt(inputValues[0]);
    const minutes = parseInt(inputValues[1]);
    const seconds = parseInt(inputValues[2]);

    let colon1grey = false;
    let colon2grey = false;

    // Hours

    if (hours === 0) {

        hourSpanNode.classList.remove('greyStart');
        hourSpanNode.classList.add('allGrey');

    } else if (hours < 10) {

        hourSpanNode.classList.add('greyStart');
        hourSpanNode.classList.remove('allGrey');

    } else {

        hourSpanNode.classList.remove('greyStart');
        hourSpanNode.classList.remove('allGrey');

    }

    // Minutes

    if (minutes === 0 && hours === 0) {

        minuteSpanNode.classList.remove('greyStart');
        minuteSpanNode.classList.add('allGrey');

        colon1grey = true;

    } else if (minutes < 10 && hours === 0) {

        minuteSpanNode.classList.add('greyStart');
        minuteSpanNode.classList.remove('allGrey');

        colon1grey = true;

    } else if (minutes >= 10 && hours === 0) {

        minuteSpanNode.classList.remove('greyStart');
        minuteSpanNode.classList.remove('allGrey');

        colon1grey = true;

    } else {

        minuteSpanNode.classList.remove('greyStart');
        minuteSpanNode.classList.remove('allGrey');

        colon1grey = false;

    }

    // Seconds

    if (seconds === 0 && minutes === 0 && hours === 0) {

        secondSpanNode.classList.add('greyStart');
        secondSpanNode.classList.remove('allGrey');

        colon2grey = true;

    } else if (seconds < 10 && minutes === 0 && hours === 0) {

        secondSpanNode.classList.add('greyStart');
        secondSpanNode.classList.remove('allGrey');

        colon2grey = true;

    } else if (seconds >= 10 && minutes === 0 && hours === 0) {

        secondSpanNode.classList.remove('greyStart');
        secondSpanNode.classList.remove('allGrey');

        colon2grey = true;

    } else {

        secondSpanNode.classList.remove('greyStart');
        secondSpanNode.classList.remove('allGrey');

        colon2grey = false;

    }

    colonSpan1.classList.remove('allGrey');
    colonSpan2.classList.remove('allGrey');

    if (colon1grey) {

        colonSpan1.classList.add('allGrey');

    } else {

        colonSpan1.classList.remove('allGrey');

    }

    if (colon2grey) {

        colonSpan2.classList.add('allGrey');

    } else {

        colonSpan2.classList.remove('allGrey');

    }

    const selectedIndex = getSelectedIndex(div);

    if (selectedIndex === 0) {

        hourSpanNode.classList.remove('greyStart');
        hourSpanNode.classList.remove('allGrey');

        colonSpan1.classList.remove('allGrey');

        minuteSpanNode.classList.remove('greyStart');
        minuteSpanNode.classList.remove('allGrey');

        colonSpan2.classList.remove('allGrey');

        secondSpanNode.classList.remove('greyStart');
        secondSpanNode.classList.remove('allGrey');

    } else if (selectedIndex === 1) {

        minuteSpanNode.classList.remove('greyStart');
        minuteSpanNode.classList.remove('allGrey');

        colonSpan2.classList.remove('allGrey');

        secondSpanNode.classList.remove('greyStart');
        secondSpanNode.classList.remove('allGrey');

    } else if (selectedIndex === 2) {

        secondSpanNode.classList.remove('greyStart');
        secondSpanNode.classList.remove('allGrey');

    }

}

/**
 * Highlight the span at index selectedIndex
 * @param {Element} div Time input div element
 */
function highlightInput (div) {

    const index = getSelectedIndex(div);

    const hourSpan = getHourSpan(div);
    const minuteSpan = getMinuteSpan(div);
    const secondSpan = getSecondSpan(div);

    const deselectedColor = getTextInput(div).style.background;

    if (index === 0) {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        secondSpan.style.color = '';
        hourSpan.style.backgroundColor = 'Highlight';
        hourSpan.style.color = 'HighlightText';
        minuteSpan.style.backgroundColor = deselectedColor;
        minuteSpan.classList.remove('grey');
        secondSpan.style.backgroundColor = deselectedColor;
        secondSpan.classList.remove('grey');

    } else if (index === 1) {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        secondSpan.style.color = '';
        hourSpan.style.backgroundColor = deselectedColor;
        hourSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = 'Highlight';
        minuteSpan.style.color = 'HighlightText';
        secondSpan.style.backgroundColor = deselectedColor;
        secondSpan.classList.remove('grey');

    } else if (index === 2) {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        secondSpan.style.color = '';
        hourSpan.style.backgroundColor = deselectedColor;
        hourSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = deselectedColor;
        minuteSpan.classList.remove('grey');
        secondSpan.style.backgroundColor = 'Highlight';
        secondSpan.style.color = 'HighlightText';

    } else {

        hourSpan.style.color = '';
        minuteSpan.style.color = '';
        secondSpan.style.color = '';
        hourSpan.style.backgroundColor = deselectedColor;
        hourSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = deselectedColor;
        minuteSpan.classList.remove('grey');
        secondSpan.style.backgroundColor = deselectedColor;
        secondSpan.classList.remove('grey');

    }

    updateGrey(div);

}

function runChangeFunction (div) {

    const changeFunction = inputData[div.id].changeFunction;

    if (changeFunction) {

        changeFunction();

    }

}

exports.addChangeFunction = (div, changeFunction) => {

    inputData[div.id].changeFunction = changeFunction;

};

/**
 * Create all the UI elements needed and add a new data structure to the lookup table
 * @param {string} divName Name assigned to custom div
 * @param {integer} min Minimum value for input
 * @param {boolean} alternateImplementation Whether or not to use alternate implementation which allows leading zeroes
 * @returns Parent div element
 */
exports.create = (divName, min, alternateImplementation) => {

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

    const colonSpanStyle = 'display: inline-block; text-align: left; width: 4px;';
    const numSpanStyle = 'display: inline-block; width: 15px; text-align: center;';

    const hourSpanNode = document.createElement('span');
    hourSpanNode.className = 'hour-span';
    hourSpanNode.innerText = '00';
    hourSpanNode.style = numSpanStyle;

    const colonSpan1Node = document.createElement('span');
    colonSpan1Node.className = 'colon-span1';
    colonSpan1Node.innerText = ':';
    colonSpan1Node.style = colonSpanStyle;

    const minuteSpanNode = document.createElement('span');
    minuteSpanNode.className = 'minute-span';
    minuteSpanNode.innerText = '00';
    minuteSpanNode.style = numSpanStyle;

    const colonSpan2Node = document.createElement('span');
    colonSpan2Node.className = 'colon-span2';
    colonSpan2Node.innerText = ':';
    colonSpan2Node.style = colonSpanStyle;

    const secondSpanNode = document.createElement('span');
    secondSpanNode.className = 'second-span';
    secondSpanNode.innerText = '00';
    secondSpanNode.style = numSpanStyle;

    holderNode.appendChild(hourSpanNode);
    holderNode.appendChild(colonSpan1Node);
    holderNode.appendChild(minuteSpanNode);
    holderNode.appendChild(colonSpan2Node);
    holderNode.appendChild(secondSpanNode);

    blockerNode.appendChild(holderNode);
    div.appendChild(blockerNode);

    parent.appendChild(div);

    const data = {};

    alternateImplementation = alternateImplementation === undefined ? false : alternateImplementation;

    data.alternateImplementation = alternateImplementation;
    data.values = [0, 0, 0];
    data.widths = [2, 2, 2];
    data.selectedIndex = -1;
    data.entry = alternateImplementation ? '0' : 0;
    data.enabled = true;
    data.fields = [hourSpanNode.className, minuteSpanNode.className, secondSpanNode.className];
    data.changeFunction = null;
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

        updateGrey(div);

    }

    hourSpanNode.addEventListener('click', () => {

        handleSpanClick(0);

    });

    minuteSpanNode.addEventListener('click', () => {

        handleSpanClick(1);

    });

    secondSpanNode.addEventListener('click', () => {

        handleSpanClick(2);

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

                setSelectedIndex(div, 2);
                highlightInput(div);
                break;

            }

        }

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

        const value = getValue(div);

        if (value < min) {

            updateFieldValue(div, 2, min);
            updateFieldSpan(div, 2);

        }

        setSelectedIndex(div, -1);
        highlightInput(div);

        updateGrey(div);

        runChangeFunction(div);

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
