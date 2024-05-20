/****************************************************************************
 * coordinateInput.js
 * openacousticdevices.info
 * November 2023
 *****************************************************************************/

'use strict';

const DEFAULT_WIDTH = '75px';
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
 * @returns [degrees, hundredths, direction]
 */
exports.getValue = (div) => {

    const values = getInputValues(div);
    return [parseInt(values[0]), parseInt(values[1]), values[2]];

};

function getSelectedValue (div) {

    const selectedIndex = getSelectedIndex(div);
    return getInputValues(div)[selectedIndex];

}

// Data structure setters

exports.setNextElements = (div, elements) => {

    inputData[div.id].nextElements = elements;

};

function setValue (div, val0, val1, positiveDirection) {

    inputData[div.id].values = [val0, val1, positiveDirection];

    updateFieldSpan(div, 0);
    updateFieldSpan(div, 1);
    updateDirectionSpan(div);

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

function updateFieldValue (div, index, value) {

    const inputValues = getInputValues(div);

    inputValues[index] = value;
    setValue(div, inputValues[0], inputValues[1], inputValues[2]);

}

function updateDirectionSpan (div) {

    const inputValues = getInputValues(div);
    const isPositiveDirection = inputValues[2];

    const isLat = isLatitude(div);
    const positiveLetter = isLat ? 'N' : 'E';
    const negativeLetter = isLat ? 'S' : 'W';

    const directionSpan = getDirectionSpan(div);
    directionSpan.innerText = isPositiveDirection ? positiveLetter : negativeLetter;

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

function isLatitude (div) {

    return inputData[div.id].isLatitude;

}

function getWidth (div, index) {

    return inputData[div.id].widths[index];

}

// Get UI elements

function getCoordSpan0 (div) {

    return div.getElementsByClassName('coord-span0')[0];

}

function getCoordSpan1 (div) {

    return div.getElementsByClassName('coord-span1')[0];

}

function getCoordSpan2 (div) {

    return div.getElementsByClassName('coord-span2')[0];

}

function getDirectionSpan (div) {

    return div.getElementsByClassName('direction-span')[0];

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

    let maxValue = 0;

    const selectedIndex = getSelectedIndex(div);

    const inputValues = getInputValues(div);

    const isLat = isLatitude(div);

    const degreeMax = isLat ? 90 : 180;

    if (selectedIndex === 0) {

        maxValue = degreeMax;

        if (inputValues[1] > 0) {

            maxValue = degreeMax - 1;

        }

    } else if (selectedIndex === 1) {

        maxValue = 99;

        if (inputValues[0] === degreeMax) {

            maxValue = 0;

        }

    }

    return maxValue;

}

function updateFieldSpan (div, index) {

    const inputValues = getInputValues(div);
    const value = inputValues[index];

    const fields = getFields(div);

    const isLat = isLatitude(div);

    // The first field for longitude fields is split into 2 subfields

    if (index === 0) {

        const fieldNames = fields[0];
        const field0 = div.getElementsByClassName(fieldNames[0])[0];
        const field1 = div.getElementsByClassName(fieldNames[1])[0];

        if (isLat) {

            field0.innerText = ' ';
            field1.innerText = value < 10 ? '0' + value.toString() : value.toString();

        } else {

            const stringValue = value.toString().padStart(3, '0');

            field0.innerText = isLat ? ' ' : stringValue.slice(0, 1);
            field1.innerText = isLat ? stringValue : stringValue.slice(1);

        }

    } else if (index === 1) {

        const fieldName = fields[index];
        const field = div.getElementsByClassName(fieldName)[0];

        field.innerText = value < 10 ? '0' + value.toString() : value.toString();

    }

}

function toggleDirection (div) {

    const inputValues = getInputValues(div);
    const isPositiveDirection = inputValues[2];

    updateFieldValue(div, 2, !isPositiveDirection);
    updateDirectionSpan(div);

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

        selectedIndex = getSelectedIndex(div);

        if (selectedIndex === 0 || selectedIndex === 1) {

            resetEntry(div);

            const currentValue = getSelectedValue(div);
            const maxValue = getMaxValue(div);

            const newValue = currentValue + 1 > maxValue ? 0 : currentValue + 1;

            updateFieldValue(div, selectedIndex, newValue);
            updateFieldSpan(div, selectedIndex);

            updateGrey(div);

        } else if (selectedIndex === 2) {

            toggleDirection(div);

        }

        return;

    }

    if (e.key === 'ArrowDown') {

        if (selectedIndex === 0 || selectedIndex === 1) {

            resetEntry(div);

            const currentValue = getSelectedValue(div);
            const maxValue = getMaxValue(div);

            const newValue = currentValue - 1 < 0 ? maxValue : currentValue - 1;

            updateFieldValue(div, selectedIndex, newValue);
            updateFieldSpan(div, selectedIndex);

            updateGrey(div);

        } else if (selectedIndex === 2) {

            toggleDirection(div);

        }

        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        selectedIndex = getSelectedIndex(div);

        if (selectedIndex === 0 || selectedIndex === 1) {

            resetEntry(div);
            updateFieldValue(div, selectedIndex, 0);
            updateFieldSpan(div, selectedIndex);

            updateGrey(div);

        }

        return;

    }

    const isLat = isLatitude(div);
    const positiveLetter = isLat ? 'n' : 'e';
    const negativeLetter = isLat ? 's' : 'w';

    if (e.key === '+' || e.key === positiveLetter || e.key === positiveLetter.toUpperCase()) {

        updateFieldValue(div, 2, true);
        updateDirectionSpan(div);

    }

    if (e.key === '-' || e.key === negativeLetter || e.key === negativeLetter.toUpperCase()) {

        updateFieldValue(div, 2, false);
        updateDirectionSpan(div);

    }

    const patt = /^[0-9]$/;

    if (patt.test(e.key) && selectedIndex !== 2) {

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

    const coordSpan0Node = getCoordSpan0(div);
    const coordSpan1Node = getCoordSpan1(div);

    const inputValues = getInputValues(div);
    const coordValue = parseInt(inputValues[0]);

    if (coordValue < 10) {

        coordSpan0Node.classList.add('allGrey');
        coordSpan1Node.classList.add('greyStart');

    } else if (coordValue < 100) {

        coordSpan0Node.classList.add('allGrey');
        coordSpan1Node.classList.remove('greyStart');

    } else {

        coordSpan0Node.classList.remove('allGrey');
        coordSpan1Node.classList.remove('greyStart');

    }

    const selectedIndex = getSelectedIndex(div);

    if (selectedIndex === 0) {

        coordSpan0Node.classList.remove('allGrey');
        coordSpan1Node.classList.remove('greyStart');

    }

}

/**
 * Highlight the span at index selectedIndex
 * @param {Element} div Time input div element
 */
function highlightInput (div) {

    const index = getSelectedIndex(div);

    const coordSpan0 = getCoordSpan0(div);
    const coordSpan1 = getCoordSpan1(div);
    const coordSpan2 = getCoordSpan2(div);
    const directionSpan = getDirectionSpan(div);

    const deselectedColor = getTextInput(div).style.background;

    if (index === 0) {

        coordSpan0.style.color = '';
        coordSpan1.style.color = '';
        coordSpan2.style.color = '';
        directionSpan.style.color = '';
        coordSpan0.style.backgroundColor = 'Highlight';
        coordSpan0.style.color = 'HighlightText';
        coordSpan1.style.backgroundColor = 'Highlight';
        coordSpan1.style.color = 'HighlightText';
        coordSpan2.style.backgroundColor = deselectedColor;
        coordSpan2.classList.remove('grey');
        directionSpan.style.backgroundColor = deselectedColor;
        directionSpan.classList.remove('grey');

    } else if (index === 1) {

        coordSpan0.style.color = '';
        coordSpan1.style.color = '';
        coordSpan2.style.color = '';
        directionSpan.style.color = '';
        coordSpan0.style.backgroundColor = deselectedColor;
        coordSpan0.classList.remove('grey');
        coordSpan1.style.backgroundColor = deselectedColor;
        coordSpan1.classList.remove('grey');
        coordSpan2.style.backgroundColor = 'Highlight';
        coordSpan2.style.color = 'HighlightText';
        directionSpan.style.backgroundColor = deselectedColor;
        directionSpan.classList.remove('grey');

    } else if (index === 2) {

        coordSpan0.style.color = '';
        coordSpan1.style.color = '';
        coordSpan2.style.color = '';
        directionSpan.style.color = '';
        coordSpan0.style.backgroundColor = deselectedColor;
        coordSpan0.classList.remove('grey');
        coordSpan1.style.backgroundColor = deselectedColor;
        coordSpan1.classList.remove('grey');
        coordSpan2.style.backgroundColor = deselectedColor;
        coordSpan2.classList.remove('grey');
        directionSpan.style.backgroundColor = 'Highlight';
        directionSpan.style.color = 'HighlightText';

    } else {

        coordSpan0.style.color = '';
        coordSpan1.style.color = '';
        coordSpan2.style.color = '';
        directionSpan.style.color = '';
        coordSpan0.style.backgroundColor = deselectedColor;
        coordSpan0.classList.remove('grey');
        coordSpan1.style.backgroundColor = deselectedColor;
        coordSpan1.classList.remove('grey');
        coordSpan2.style.backgroundColor = deselectedColor;
        coordSpan2.classList.remove('grey');
        directionSpan.style.backgroundColor = deselectedColor;
        directionSpan.classList.remove('grey');

    }

    updateGrey(div);

}

/**
 * Create all the UI elements needed and add a new data structure to the lookup table
 * @param {string} divName Name assigned to custom div
 * @param {boolean} isLat Is the element a latitude or longitude coordinate
 * @param {boolean} alternateImplementation Whether or not to use alternate implementation which allows leading zeroes
 * @param {Function} focusOutFunction Function called when focusing away from input
 * @returns Parent div element
 */
exports.create = (divName, isLat, alternateImplementation, focusOutFunction) => {

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
    const dotSpanStyle = 'display: inline-block; text-align: center; width: 4px;';
    const degreeSpanStyle = 'display: inline-block; text-align: center; width: 8px;';
    const directionSpanStyle = 'display: inline-block; text-align: left; width: 12px;';

    const inputNode = document.createElement('input');
    inputNode.className = 'text-input';
    inputNode.type = 'text';
    inputNode.style = 'width: ' + width + '; height: ' + height + '; color: white; caret-color: transparent;';

    div.appendChild(inputNode);

    const blockerNode = document.createElement('div');
    blockerNode.style = 'position: absolute; top: 0px; margin-left: 0px; margin-top: 0px; width: 100%; height: 100%;';

    const holderNode = document.createElement('div');
    holderNode.className = 'holder';
    const holderMarginLeft = isLat ? 9 : 7;
    holderNode.style = 'position: absolute; top: 0px; margin-left: ' + holderMarginLeft + 'px; margin-top: 3px;';

    const coordSpanNode0 = document.createElement('span');
    coordSpanNode0.className = 'coord-span0';
    coordSpanNode0.innerText = isLat ? ' ' : '0';
    coordSpanNode0.style = numSpanStyle1;

    const coordSpanNode1 = document.createElement('span');
    coordSpanNode1.className = 'coord-span1';
    coordSpanNode1.innerText = '00';
    coordSpanNode1.style = numSpanStyle2;

    const dotSpanNode = document.createElement('span');
    dotSpanNode.className = 'dot-span';
    dotSpanNode.innerText = '.';
    dotSpanNode.style = dotSpanStyle;

    const coordSpanNode2 = document.createElement('span');
    coordSpanNode2.className = 'coord-span2';
    coordSpanNode2.innerText = '00';
    coordSpanNode2.style = numSpanStyle2;

    const degreeSpanNode = document.createElement('span');
    degreeSpanNode.className = 'degree-span';
    degreeSpanNode.innerText = '°';
    degreeSpanNode.style = degreeSpanStyle;

    const directionSpanNode = document.createElement('span');
    directionSpanNode.className = 'direction-span';
    directionSpanNode.innerText = isLat ? 'N' : 'E';
    directionSpanNode.style = directionSpanStyle;

    holderNode.appendChild(coordSpanNode0);
    holderNode.appendChild(coordSpanNode1);
    holderNode.appendChild(dotSpanNode);
    holderNode.appendChild(coordSpanNode2);
    holderNode.appendChild(degreeSpanNode);
    holderNode.appendChild(directionSpanNode);

    blockerNode.appendChild(holderNode);
    div.appendChild(blockerNode);

    parent.appendChild(div);

    const data = {};

    alternateImplementation = alternateImplementation === undefined ? false : alternateImplementation;

    data.alternateImplementation = alternateImplementation;
    data.values = [0, 0, true];
    data.widths = [isLat ? 2 : 3, 2, 1];
    data.isLatitude = isLat;
    data.selectedIndex = -1;
    data.entry = alternateImplementation ? '0' : 0;
    data.enabled = true;
    data.fields = [[coordSpanNode0.className, coordSpanNode1.className], coordSpanNode2.className, directionSpanNode.className];
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

    coordSpanNode0.addEventListener('click', () => {

        handleSpanClick(0);

    });

    coordSpanNode1.addEventListener('click', () => {

        handleSpanClick(0);

    });

    coordSpanNode2.addEventListener('click', () => {

        handleSpanClick(1);

    });

    directionSpanNode.addEventListener('click', () => {

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

        setSelectedIndex(div, -1);
        highlightInput(div);

        updateGrey(div);

        const inputValues = getInputValues(div);

        if (inputValues[0] === 0 && inputValues[1] === 0 && inputValues[2] === false) {

            setValue(div, 0, 0, true);

        }

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
