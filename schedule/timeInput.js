'use strict';

/* global document, HTMLElement, customElements */

const DEFAULT_WIDTH = '50px';
const DEFAULT_HEIGHT = '25px';

exports.getValue = (div) => {

    const inputValues = div.getAttribute('inputValues').split(',');
    return inputValues[0] + ':' + inputValues[1];

};

exports.setValue = (div, hour, minute) => {

    if (hour < 0 || hour > 24) {

        return;

    }

    if ((hour === 24 && minute !== 0) || (hour < 24 && minute > 59)) {

        return;

    }

    const textInput = getTextInput(div);
    setAttributeValue(textInput, 'inputValues', hour + ',' + minute);
    div.setAttribute('numbersEntered', '0');
    div.setAttribute('selectedIndex', '-1');

    getHourSpan(div).innerText = ('0' + hour).slice(-2);
    getMinuteSpan(div).innerText = ('0' + minute).slice(-2);

};

function isEnabled (node) {

    return node.getAttribute('enabled') === 'true';

}

exports.setEnabled = (div, setting) => {

    div.setAttribute('enabled', setting ? 'true' : 'false');

    const hourSpan = getMinuteSpan(div);
    const colonSpan = getColonSpan(div);
    const minuteSpan = getHourSpan(div);
    const textInput = getTextInput(div);

    if (setting) {

        textInput.style.backgroundColor = '';
        textInput.style.border = '';
        hourSpan.classList.remove('grey');
        hourSpan.style.backgroundColor = '';
        colonSpan.classList.remove('grey');
        colonSpan.style.backgroundColor = '';
        minuteSpan.classList.remove('grey');
        minuteSpan.style.backgroundColor = '';

        textInput.tabIndex = 0;

    } else {

        switch (process.platform) {

        case 'linux':
        case 'win32':
            textInput.style.backgroundColor = '#EBEBE4';
            textInput.style.border = '1px solid #cccccc';
            hourSpan.classList.add('grey');
            hourSpan.style.backgroundColor = '#EBEBE4';
            colonSpan.classList.add('grey');
            colonSpan.style.backgroundColor = '#EBEBE4';
            minuteSpan.classList.add('grey');
            minuteSpan.style.backgroundColor = '#EBEBE4';
            break;

        case 'darwin':
            hourSpan.classList.add('grey');
            hourSpan.style.backgroundColor = 'white';
            colonSpan.classList.add('grey');
            colonSpan.style.backgroundColor = 'white';
            minuteSpan.classList.add('grey');
            minuteSpan.style.backgroundColor = 'white';
            break;

        }

        textInput.tabIndex = -1;

    }

};

function getAttributeValue (node, attributeName) {

    return node.parentNode.getAttribute(attributeName);

}

function setAttributeValue (node, attributeName, value) {

    node.parentNode.setAttribute(attributeName, value);

}

function getTextInput (node) {

    return node.getElementsByClassName('time-text-input')[0];

}

function getTextInputFromChild (node) {

    return getTextInput(node.parentNode);

}

function getColonSpan (node) {

    return node.getElementsByClassName('colon-span')[0];

}

function getHourSpan (node) {

    return node.getElementsByClassName('hour-span')[0];

}

function getHourSpanFromChild (node) {

    return getHourSpan(node.parentNode);

}

function getMinuteSpan (node) {

    return node.getElementsByClassName('minute-span')[0];

}

function getMinuteSpanFromChild (node) {

    return getMinuteSpan(node.parentNode);

}

function getInputValuesFromChild (node) {

    const inputValues = getAttributeValue(node, 'inputValues').split(',');

    return [parseInt(inputValues[0]), parseInt(inputValues[1])];

}

function getSelectedIndex (node) {

    return parseInt(getAttributeValue(node, 'selectedIndex'));

}

function getNumbersEntered (node) {

    return parseInt(getAttributeValue(node, 'numbersEntered'));

}

function highlightInput (node) {

    const index = getSelectedIndex(node);

    const hourSpan = getHourSpanFromChild(node);
    const minuteSpan = getMinuteSpanFromChild(node);

    const deselectedColor = getTextInputFromChild(node).style.background;

    if (index === 0) {

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

exports.updateHighlights = (div) => {

    highlightInput(div.getElementsByClassName('time-holder')[0]);

};

function setHour (node, value) {

    const inputValues = getInputValuesFromChild(node);

    setAttributeValue(node, 'inputValues', value + ',' + inputValues[1].toString());

}

function setMinute (node, value) {

    const inputValues = getInputValuesFromChild(node);

    setAttributeValue(node, 'inputValues', inputValues[0].toString() + ',' + value);

}

function resetInput (node, index) {

    if (index === 0) {

        setHour(node, 0);
        getHourSpanFromChild(node).innerText = '00';

    } else {

        setMinute(node, 0);
        getMinuteSpanFromChild(node).innerText = '00';

    }

}

function checkForBlanks (node) {

    const inputValues = getInputValuesFromChild(node);

    if (inputValues[0] === -1) {

        resetInput(node, 0);

    }

    if (inputValues[1] === -1) {

        resetInput(node, 1);

    }

}

function nextSelection (node) {

    const currentSelectedIndex = getSelectedIndex(node);
    const newSelectedIndex = (currentSelectedIndex + 1 >= 2) ? 1 : currentSelectedIndex + 1;

    setAttributeValue(node, 'selectedIndex', newSelectedIndex);
    highlightInput(node);
    setAttributeValue(node, 'numbersEntered', '0');

}

function previousSelection (node) {

    const currentSelectedIndex = getSelectedIndex(node);
    const newSelectedIndex = (currentSelectedIndex - 1 < 0) ? 0 : currentSelectedIndex - 1;

    setAttributeValue(node, 'selectedIndex', newSelectedIndex);
    highlightInput(node);
    setAttributeValue(node, 'numbersEntered', '0');

}

function getMaxValue (node) {

    let maxValue;

    const selectedIndex = getSelectedIndex(node);
    const inputValues = getInputValuesFromChild(node);

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

function updateHourValue (node, inputKey) {

    let newValue, inputValues;

    const maxValue = getMaxValue(node);
    const selectedIndex = getSelectedIndex(node);

    if (getNumbersEntered(node) === 1) {

        newValue = inputKey;

        newValue = (parseInt(newValue) > maxValue) ? maxValue : newValue;

        if (selectedIndex === 0) {

            setHour(node, newValue.toString());
            getHourSpanFromChild(node).innerText = '0' + newValue;

        } else {

            setMinute(node, newValue.toString());
            getMinuteSpanFromChild(node).innerText = '0' + newValue;

        }

        if (parseInt(newValue) > 2) {

            nextSelection(node);

        }

    } else {

        inputValues = getInputValuesFromChild(node);

        newValue = inputValues[selectedIndex].toString() + inputKey;

        newValue = (parseInt(newValue) > maxValue) ? maxValue : newValue;

        if (selectedIndex === 0) {

            setHour(node, newValue.toString());
            getHourSpanFromChild(node).innerText = newValue;

        } else {

            setMinute(node, newValue.toString());
            getMinuteSpanFromChild(node).innerText = newValue;

        }

        nextSelection(node);

    }

}

function updateMinuteValue (node, inputKey) {

    let newValue, inputValues;

    const maxValue = getMaxValue(node);
    const selectedIndex = getSelectedIndex(node);

    if (getNumbersEntered(node) === 1) {

        newValue = inputKey;

        newValue = (parseInt(newValue) > maxValue) ? maxValue : newValue;

        if (selectedIndex === 0) {

            setHour(node, newValue.toString());
            getHourSpanFromChild(node).innerText = '0' + newValue;

        } else {

            setMinute(node, newValue.toString());
            getMinuteSpanFromChild(node).innerText = '0' + newValue;

        }

        if (newValue > 5) {

            setAttributeValue(node, 'numbersEntered', '0');

        }

    } else {

        inputValues = getInputValuesFromChild(node);

        newValue = inputValues[selectedIndex].toString() + inputKey;

        newValue = (parseInt(newValue) > maxValue) ? maxValue : newValue;

        if (selectedIndex === 0) {

            setHour(node, newValue.toString());
            getHourSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

        } else {

            setMinute(node, newValue.toString());
            getMinuteSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

        }

        setAttributeValue(node, 'numbersEntered', '0');

    }

}

function incrementValue (node) {

    let newValue;

    const maxValue = getMaxValue(node);
    const inputValues = getInputValuesFromChild(node);
    const selectedIndex = getSelectedIndex(node);

    if (inputValues[selectedIndex] === -1) {

        newValue = 0;

    } else {

        newValue = inputValues[selectedIndex] + 1;
        newValue = (newValue > maxValue) ? maxValue : newValue;

    }

    if (selectedIndex === 0) {

        setHour(node, newValue.toString());
        getHourSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

    } else {

        setMinute(node, newValue.toString());
        getMinuteSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

    }

    setAttributeValue(node, 'numbersEntered', '0');

}

function decrementValue (node) {

    let newValue;

    const maxValue = getMaxValue(node);
    const inputValues = getInputValuesFromChild(node);
    const selectedIndex = getSelectedIndex(node);

    if (inputValues[selectedIndex] === -1) {

        newValue = maxValue;

    } else {

        newValue = inputValues[selectedIndex] - 1;
        newValue = (newValue < 0) ? 0 : newValue;

    }

    if (selectedIndex === 0) {

        setHour(node, newValue.toString());
        getHourSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

    } else {

        setMinute(node, newValue.toString());
        getMinuteSpanFromChild(node).innerText = ('0' + newValue).slice(-2);

    }

    setAttributeValue(node, 'numbersEntered', '0');

}

function handleKeyDown (e) {

    let selectedIndex, numbersEntered;

    selectedIndex = getAttributeValue(e.target, 'selectedIndex');

    if (e.key === 'Tab') {

        if (e.shiftKey) {

            setAttributeValue(e.target, 'selectedIndex', (selectedIndex - 1).toString());
            selectedIndex = getSelectedIndex(e.target);

            if (selectedIndex > -1) {

                e.preventDefault();

            } else {

                setAttributeValue(e.target, 'selectedIndex', '-1');

            }

        } else {

            setAttributeValue(e.target, 'selectedIndex', (selectedIndex + 1).toString());
            selectedIndex = getSelectedIndex(e.target);

            /* If tab should jump between hours and minutes */
            if (selectedIndex < 2) {

                e.preventDefault();

            } else {

                setAttributeValue(e.target, 'selectedIndex', '-1');

            }

        }

        checkForBlanks(e.target);

        highlightInput(e.target);

        setAttributeValue(e.target, 'numbersEntered', '0');

        return;

    }

    e.preventDefault();

    if (e.key === 'ArrowRight') {

        checkForBlanks(e.target);
        nextSelection(e.target);
        return;

    }

    if (e.key === 'ArrowLeft') {

        checkForBlanks(e.target);
        previousSelection(e.target);
        return;

    }

    if (e.key === 'ArrowUp') {

        incrementValue(e.target);
        return;

    }

    if (e.key === 'ArrowDown') {

        decrementValue(e.target);
        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        selectedIndex = getSelectedIndex(e.target);

        if (selectedIndex === 0) {

            setHour(e.target, '-1');
            getHourSpanFromChild(e.target).innerText = '00';
            setAttributeValue(e.target, 'numbersEntered', '0');

        } else {

            setMinute(e.target, '-1');
            getMinuteSpanFromChild(e.target).innerText = '00';
            setAttributeValue(e.target, 'numbersEntered', '0');

        }

        return;

    }

    const patt = new RegExp('^[0-9]$');

    if (patt.test(e.key)) {

        numbersEntered = getAttributeValue(e.target, 'numbersEntered');

        if (getAttributeValue(e.target, 'numbersEntered') < 2) {

            numbersEntered++;
            setAttributeValue(e.target, 'numbersEntered', numbersEntered);

            selectedIndex = getSelectedIndex(e.target);

            if (selectedIndex === 0) {

                updateHourValue(e.target, e.key);

            } else {

                updateMinuteValue(e.target, e.key);

            }

        }

    }

}

class TimeInput extends HTMLElement {

    connectedCallback () {

        let width, height;

        const parent = this.parentNode;

        const attributes = this.attributes;

        width = this.style.width;
        width = (width === '') ? DEFAULT_WIDTH : width;
        height = this.style.height;
        height = (height === '') ? DEFAULT_HEIGHT : height;

        parent.removeChild(this);

        const divNode = document.createElement('div');
        divNode.style = 'position: relative;';

        for (let i = 0; i < attributes.length; i++) {

            if (attributes[i].name !== 'style') {

                divNode.setAttribute(attributes[i].name, attributes[i].value);

            }

        }

        const inputNode = document.createElement('input');
        inputNode.className = 'time-text-input';
        inputNode.type = 'text';
        inputNode.style = 'width: ' + width + '; height: ' + height + '; color: white; caret-color: transparent;';

        divNode.appendChild(inputNode);

        const blockerNode = document.createElement('div');
        blockerNode.style = 'position: absolute; top: 0px; margin-left: 0px; margin-top: 0px; width: 100%; height: 100%;';

        const holderNode = document.createElement('div');
        holderNode.className = 'time-holder';
        holderNode.style = 'position: absolute; top: 0px; margin-left: 9px; margin-top: 3px;';

        const hourSpanNode = document.createElement('span');
        hourSpanNode.className = 'hour-span';
        hourSpanNode.innerText = '00';

        const colonSpanNode = document.createElement('span');
        colonSpanNode.className = 'colon-span';
        colonSpanNode.innerText = ':';

        const minuteSpanNode = document.createElement('span');
        minuteSpanNode.className = 'minute-span';
        minuteSpanNode.innerText = '00';

        holderNode.appendChild(hourSpanNode);
        holderNode.appendChild(colonSpanNode);
        holderNode.appendChild(minuteSpanNode);

        blockerNode.appendChild(holderNode);
        divNode.appendChild(blockerNode);

        parent.appendChild(divNode);

        divNode.setAttribute('inputValues', '0,0');
        divNode.setAttribute('selectedIndex', '-1');
        divNode.setAttribute('numbersEntered', '0,0');
        divNode.setAttribute('enabled', 'true');

        inputNode.addEventListener('keydown', handleKeyDown);

        hourSpanNode.addEventListener('click', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            divNode.setAttribute('selectedIndex', '0');
            highlightInput(inputNode);
            inputNode.focus();

        });

        minuteSpanNode.addEventListener('click', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            divNode.setAttribute('selectedIndex', '1');
            highlightInput(inputNode);
            inputNode.focus();

        });

        inputNode.addEventListener('focusin', function () {

            divNode.setAttribute('numbersEntered', '0');

            if (!isEnabled(divNode)) {

                inputNode.blur();
                return;

            }

            if (divNode.getAttribute('selectedIndex') === '-1') {

                divNode.setAttribute('selectedIndex', '0');
                highlightInput(inputNode);

            }

        });

        inputNode.addEventListener('focusout', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            divNode.setAttribute('selectedIndex', '-1');
            highlightInput(inputNode);
            checkForBlanks(inputNode);

        });

        inputNode.addEventListener('click', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            divNode.setAttribute('selectedIndex', '0');
            highlightInput(inputNode);
            inputNode.focus();

        });

    }

}

customElements.define('time-input', TimeInput);
