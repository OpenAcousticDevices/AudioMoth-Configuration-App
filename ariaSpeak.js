/****************************************************************************
 * ariaSpeak.js
 * openacousticdevices.info
 * May 2023
 *****************************************************************************/

/**
 * Say something if user is using a screen reader
 * @param {string} text Text which should be said if viewed on a screen reader
 */
exports.speak = (text) => {

    const element = document.createElement('div');
    const id = 'speak-' + Date.now();
    element.setAttribute('id', id);
    element.setAttribute('aria-live', 'polite');
    element.classList.add('visually-hidden');
    document.body.appendChild(element);

    window.setTimeout(() => {

        document.getElementById(id).innerHTML = text;

    }, 100);

    window.setTimeout(() => {

        document.body.removeChild(document.getElementById(id));

    }, 1000);

};
