/****************************************************************************
 * durationInput.js
 * openacousticdevices.info
 * November 2019
 *****************************************************************************/

'use strict';

/* global document, HTMLElement, customElements, Event */

const DEFAULT_MAX_CHAR_LENGTH = 5;
/* Currently, only single digit minimums are supported. Minimums of 10 or greater will require reimplementation */
const DEFAULT_MIN_VALUE = 0;
const DEFAULT_MAX_VALUE = 43200;

const DEFAULT_WIDTH = '100px';
const DEFAULT_HEIGHT = '25px';

function getSpan (node) {

    return node.getElementsByClassName('duration-span')[0];

}

function getSpanFromChild (node) {

    return getSpan(node.parentNode);

}

function getTextInput (node) {

    return node.getElementsByClassName('duration-text-input')[0];

}

function getAttributeValue (node, attributeName) {

    return node.parentNode.getAttribute(attributeName);

}

function setAttributeValue (node, attributeName, value) {

    node.parentNode.setAttribute(attributeName, value);

}

exports.getValue = (div) => {

    return parseInt(div.getAttribute('inputValue'));

};

exports.setValue = (div, value) => {

    div.setAttribute('inputValue', value.toString());
    div.setAttribute('numbersEntered', value.toString().length - 1);
    getSpan(div).innerText = value.toString();

};

exports.setEnabled = (div, setting) => {

    div.setAttribute('enabled', setting ? 'true' : 'false');

    const span = getSpan(div);
    const textInput = getTextInput(div);

    if (setting) {

        textInput.style.backgroundColor = '';
        textInput.style.border = '';
        span.classList.remove('grey');
        span.style.backgroundColor = '';

        textInput.tabIndex = 0;

    } else {

        switch (process.platform) {

        case 'linux':
        case 'win32':
            textInput.style.backgroundColor = '#EBEBE4';
            textInput.style.border = '1px solid #cccccc';
            span.classList.add('grey');
            span.style.backgroundColor = '#EBEBE4';
            break;

        case 'darwin':
            span.classList.add('grey');
            span.style.backgroundColor = 'white';
            break;

        }

        textInput.tabIndex = -1;

    }

};

function highlightInput (node) {

    const span = getSpanFromChild(node);

    if (getAttributeValue(node, 'selected') === 'true') {

        span.style.backgroundColor = 'Highlight';
        span.style.color = 'HighlightText';

    } else {

        span.style.color = '';
        span.style.backgroundColor = '';
        span.classList.remove('grey');

    }

}

exports.updateHighlights = (div) => {

    highlightInput(div.getElementsByClassName('duration-holder')[0]);

};

function updateValue (inputKey, node) {

    let newValue, maxValue;

    const currentNumbersEntered = parseInt(getAttributeValue(node, 'numbersEntered'));
    const currentInputValue = getAttributeValue(node, 'inputValue');

    maxValue = getAttributeValue(node, 'maxValue');
    maxValue = (maxValue === null) ? DEFAULT_MAX_VALUE : maxValue;

    if (currentNumbersEntered === 1) {

        newValue = inputKey;

        setAttributeValue(node, 'inputValue', parseInt(newValue));
        getSpanFromChild(node).innerText = newValue;

    } else {

        if (currentInputValue === '0') {

            newValue = inputKey;

            setAttributeValue(node, 'inputValue', parseInt(newValue));
            getSpanFromChild(node).innerText = newValue;

            setAttributeValue(node, 'numbersEntered', 1);

        } else {

            newValue = currentInputValue + inputKey;

            if (parseInt(newValue) > maxValue) {

                setAttributeValue(node, 'inputValue', maxValue.toString());
                getSpanFromChild(node).innerText = maxValue.toString();

            } else {

                setAttributeValue(node, 'inputValue', parseInt(newValue));
                getSpanFromChild(node).innerText = newValue;

            }

        }

    }

}

function incrementValue (node) {

    let newValue, maxValue, minValue;

    maxValue = getAttributeValue(node, 'maxValue');
    maxValue = (maxValue === null) ? DEFAULT_MAX_VALUE : parseInt(maxValue);

    newValue = parseInt(getAttributeValue(node, 'inputValue')) + 1;
    newValue = (newValue > maxValue) ? maxValue : newValue;

    setAttributeValue(node, 'inputValue', newValue);
    getSpanFromChild(node).innerText = newValue;

    minValue = getAttributeValue(node, 'minValue');
    minValue = (minValue === null) ? DEFAULT_MIN_VALUE : parseInt(minValue);

    setAttributeValue(node, 'numbersEntered', minValue.toString().length - 1);

}

function decrementValue (node) {

    let newValue, minValue;

    minValue = getAttributeValue(node, 'minValue');
    minValue = (minValue === null) ? DEFAULT_MIN_VALUE : parseInt(minValue);

    newValue = parseInt(getAttributeValue(node, 'inputValue')) - 1;
    newValue = (parseInt(newValue) < minValue) ? minValue : newValue;

    setAttributeValue(node, 'inputValue', newValue);
    getSpanFromChild(node).innerText = newValue;

    setAttributeValue(node, 'numbersEntered', minValue.toString().length - 1);

}

function handleKeyDown (e) {

    if (e.key === 'Tab') {

        return;

    }

    e.preventDefault();

    if (e.key === 'ArrowUp') {

        incrementValue(e.target);
        e.target.parentNode.dispatchEvent(new Event('change'));
        return;

    }

    if (e.key === 'ArrowDown') {

        decrementValue(e.target);
        e.target.parentNode.dispatchEvent(new Event('change'));
        return;

    }

    if (e.key === 'Backspace' || e.key === 'Delete') {

        let minValue = getAttributeValue(e.target, 'minValue');
        minValue = (minValue === null) ? DEFAULT_MIN_VALUE : parseInt(minValue);

        setAttributeValue(e.target, 'inputValue', minValue.toString());
        getSpanFromChild(e.target).innerText = minValue.toString();
        setAttributeValue(e.target, 'numbersEntered', '0');

        e.target.parentNode.dispatchEvent(new Event('change'));

        return;

    }

    const patt = new RegExp('^[0-9]$');

    if (patt.test(e.key)) {

        const currentNumbersEntered = parseInt(getAttributeValue(e.target, 'numbersEntered'));

        let maxCharLength = getAttributeValue(e.target, 'maxcharlength');
        maxCharLength = (maxCharLength === null) ? DEFAULT_MAX_CHAR_LENGTH : maxCharLength;

        if (currentNumbersEntered <= maxCharLength) {

            setAttributeValue(e.target, 'numbersEntered', (currentNumbersEntered + 1).toString());
            updateValue(e.key, e.target);

        }

        e.target.parentNode.dispatchEvent(new Event('change'));

    }

}

function isEnabled (node) {

    return node.getAttribute('enabled') === 'true';

}

class DurationInput extends HTMLElement {

    connectedCallback () {

        let width, height, minValue;

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

        minValue = divNode.getAttribute('minValue');
        minValue = (minValue === null) ? DEFAULT_MIN_VALUE : parseInt(minValue);

        const inputNode = document.createElement('input');
        inputNode.className = 'duration-text-input';
        inputNode.type = 'text';
        inputNode.style = 'width: ' + width + '; height: ' + height + '; color: white; caret-color: transparent;';

        divNode.appendChild(inputNode);

        const blockerNode = document.createElement('div');
        blockerNode.style = 'position: absolute; top: 0px; margin-left: 0px; margin-top: 0px; width: 100%; height: 100%;';

        const holderNode = document.createElement('div');
        holderNode.className = 'duration-holder';
        holderNode.style = 'position: absolute; top: 0px; margin-left: 5%; margin-top: 2px; width: 90%;';

        const spanNode = document.createElement('span');
        spanNode.className = 'duration-span';
        spanNode.innerText = minValue.toString();
        spanNode.style = 'float: right;';

        holderNode.appendChild(spanNode);

        blockerNode.appendChild(holderNode);

        divNode.appendChild(blockerNode);

        parent.appendChild(divNode);

        divNode.setAttribute('inputValue', minValue.toString());
        divNode.setAttribute('numbersEntered', minValue.toString().length - 1);
        divNode.setAttribute('selected', 'false');
        divNode.setAttribute('enabled', 'true');

        inputNode.addEventListener('keydown', handleKeyDown);

        holderNode.addEventListener('click', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            setAttributeValue(inputNode, 'selected', 'true');
            highlightInput(inputNode);

            inputNode.focus();

        });

        inputNode.addEventListener('focusin', function () {

            minValue = divNode.getAttribute('minValue');
            minValue = (minValue === null) ? DEFAULT_MIN_VALUE : parseInt(minValue);

            if (!isEnabled(divNode)) {

                inputNode.blur();
                return;

            }

            divNode.setAttribute('numbersEntered', minValue.toString().length - 1);
            setAttributeValue(inputNode, 'selected', 'true');
            highlightInput(inputNode);

        });

        inputNode.addEventListener('focusout', function () {

            var maxValue, currentInputValue;

            maxValue = divNode.getAttribute('maxValue');
            maxValue = (maxValue === null) ? DEFAULT_MAX_VALUE : parseInt(maxValue);

            if (!isEnabled(divNode)) {

                return;

            }

            currentInputValue = parseInt(getAttributeValue(inputNode, 'inputValue'));

            if (currentInputValue < minValue || currentInputValue > maxValue) {

                setAttributeValue(inputNode, 'inputValue', minValue.toString());
                setAttributeValue(inputNode, 'numbersEntered', minValue.toString().length - 1);
                getSpanFromChild(inputNode).innerText = minValue.toString();

            }

            setAttributeValue(inputNode, 'selected', 'false');
            highlightInput(inputNode);

            divNode.dispatchEvent(new Event('change'));

        });

        inputNode.addEventListener('click', function () {

            if (!isEnabled(divNode)) {

                return;

            }

            highlightInput(inputNode);
            inputNode.focus();

        });

    }

}

customElements.define('duration-input', DurationInput);
