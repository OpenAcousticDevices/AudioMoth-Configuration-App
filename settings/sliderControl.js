/****************************************************************************
 * sliderControl.js
 * openacousticdevices.info
 * April 2022
 *****************************************************************************/

/**
 * Disable playback slider and change CSS to display disabled cursor on hover
 */
function disableSlider (slider, div) {

    slider.disable();

    const children = div.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {

        if (children[i].style) {

            children[i].style.cursor = 'not-allowed';

        }

    }

}

/**
 * Enable playback slider and reset CSS cursor
 */
function enableSlider (slider, div) {

    slider.enable();

    const children = div.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {

        if (children[i].style) {

            children[i].style.cursor = '';

        }

    }

}

// Check if code is running on Config App or Filter Playground as importing/exporting works differently in Electron
if (window && window.process && window.process.type) {

    exports.enableSlider = enableSlider;
    exports.disableSlider = disableSlider;

}
