/****************************************************************************
 * timeZoneSelection.js
 * openacousticdevices.info
 * October 2023
 *****************************************************************************/

const electron = require('electron');

/* Get common functions to add night mode functionality */
require('./processing/uiCommon.js');

const constants = require('./constants');

const timeZones = [
    ['BIT', 'Baker Island Time', '-12'],

    ['NUT', 'Niue Time', '-11'],
    ['SST', 'Samoa Standard Time', '-11'],

    ['CKT', 'Cook Island Time', '-10'],
    ['HAST', 'Hawaii-Aleutian Standard Time', '-10'],
    ['TAHT', 'Tahiti Time', '-10'],

    ['MART', 'Marquesas Islands Time', '-9:30'],
    ['MIT', 'Marquesas Islands Time', '-9:30'],

    ['AKST', 'Alaska Standard Time', '-9'],
    ['GAMT', 'Gambier Islands', '-9'],
    ['GIT', 'Gambier Island Time', '-9'],
    ['HADT', 'Hawaii-Aleutian Daylight Time', '-9'],

    ['AKDT', 'Alaska Daylight Time', '-8'],
    ['CIST', 'Clipperton Island Standard Time', '-8'],
    ['PST', 'Pacific Standard Time (North America)', '-8'],

    ['MST', 'Mountain Standard Time (North America)', '-7'],
    ['PDT', 'Pacific Daylight Time (North America)', '-7'],

    ['CST', 'Central Standard Time (North America)', '-6'],
    ['EAST', 'Easter Island Standard Time', '-6'],
    ['GALT', 'Galapagos Time', '-6'],
    ['MDT', 'Mountain Daylight Time (North America)', '-6'],

    ['ACT', 'Acre Time', '-5'],
    ['CDT', 'Central Daylight Time (North America)', '-5'],
    ['COT', 'Colombia Time', '-5'],
    ['CST', 'Cuba Standard Time', '-5'],
    ['EASST', 'Easter Island Summer Time', '-5'],
    ['ECT', 'Ecuador Time', '-5'],
    ['EST', 'Eastern Standard Time (North America)', '-5'],
    ['PET', 'Peru Time', '-5'],

    ['AMT', 'Amazon Time (Brazil)', '-4'],
    ['AST', 'Atlantic Standard Time', '-4'],
    ['BOT', 'Bolivia Time', '-4'],
    ['CDT', 'Cuba Daylight Time', '-4'],
    ['CLT', 'Chile Standard Time', '-4'],
    ['COST', 'Colombia Summer Time', '-4'],
    ['ECT', 'Eastern Caribbean Time', '-4'],
    ['EDT', 'Eastern Daylight Time (North America)', '-4'],
    ['FKT', 'Falkland Islands Time', '-4'],
    ['GYT', 'Guyana Time', '-4'],
    ['PYT', 'Paraguay Time (South America)', '-4'],
    ['VET', 'Venezuelan Standard Time', '-4'],

    ['NST', 'Newfoundland Standard Time', '-3:30'],
    ['NT', 'Newfoundland Time', '-3:30'],

    ['ADT', 'Atlantic Daylight Time', '-3'],
    ['AMST', 'Amazon Summer Time (Brazil)', '-3'],
    ['ART', 'Argentina Time', '-3'],
    ['BRT', 'Brasilia Time', '-3'],
    ['CLST', 'Chile Summer Time', '-3'],
    ['FKST', 'Falkland Islands Summer Time', '-3'],
    ['GFT', 'French Guiana Time', '-3'],
    ['PMST', 'Saint Pierre and Miquelon Standard Time', '-3'],
    ['PYST', 'Paraguay Summer Time (South America)', '-3'],
    ['ROTT', 'Rothera Research Station Time', '-3'],
    ['SRT', 'Suriname Time', '-3'],
    ['UYT', 'Uruguay Standard Time', '-3'],

    ['NDT', 'Newfoundland Daylight Time', '-2:30'],

    ['BRST', 'Brasilia Summer Time', '-2'],
    ['FNT', 'Fernando de Noronha Time', '-2'],

    ['GST', 'South Georgia and the South Sandwich Islands', '-2'],
    ['PMDT', 'Saint Pierre and Miquelon Daylight time', '-2'],
    ['UYST', 'Uruguay Summer Time', '-2'],

    ['AZOT', 'Azores Standard Time', '-1'],
    ['CVT', 'Cape Verde Time', '-1'],
    ['EGT', 'Eastern Greenland Time', '-1'],

    ['AZOST', 'Azores Summer Time', '+0'],
    ['EGST', 'Eastern Greenland Summer Time', '+0'],
    ['GMT', 'Greenwich Mean Time', '+0'],
    ['UTC', 'Coordinated Universal Time', '+0'],
    ['WET', 'Western European Time', '+0'],

    ['BST', 'British Summer Time', '+1'],
    ['CET', 'Central European Time', '+1'],
    ['DFT', 'AIX specific equivalent of Central European Time', '+1'],
    ['IST', 'Irish Standard Time', '+1'],
    ['MET', 'Middle European Time', '+1'],
    ['WAT', 'West Africa Time', '+1'],
    ['WEST', 'Western European Summer Time', '+1'],

    ['CAT', 'Central Africa Time', '+2'],
    ['CEST', 'Central European Summer Time', '+2'],
    ['EET', 'Eastern European Time', '+2'],
    ['HAEC', 'Heure Avancée d\'Europe Centrale', '+2'],
    ['IST', 'Israel Standard Time', '+2'],
    ['MEST', 'Middle European Summer Time', '+2'],
    ['SAST', 'South African Standard Time', '+2'],
    ['USZ1', 'Kaliningrad Time', '+2'],
    ['WAST', 'West Africa Summer Time', '+2'],

    ['AST', 'Arabia Standard Time', '+3'],
    ['EAT', 'East Africa Time', '+3'],
    ['EEST', 'Eastern European Summer Time', '+3'],
    ['FET', 'Further-eastern European Time', '+3'],
    ['IOT', 'Indian Ocean Time', '+3'],

    ['IRST', 'Iran Standard Time', '+3:30'],

    ['IDT', 'Israel Daylight Time', '+3'],
    ['MSK', 'Moscow Time', '+3'],
    ['SYOT', 'Showa Station Time', '+3'],
    ['TRT', 'Turkey Time', '+3'],

    ['AMT', 'Armenia Time', '+4'],
    ['AZT', 'Azerbaijan Time', '+4'],
    ['GET', 'Georgia Standard Time', '+4'],
    ['GST', 'Gulf Standard Time', '+4'],
    ['MUT', 'Mauritius Time', '+4'],
    ['RET', 'Réunion Time', '+4'],
    ['SAMT', 'Samara Time', '+4'],
    ['SCT', 'Seychelles Time', '+4'],
    ['VOLT', 'Volgograd Time', '+4'],

    ['AFT', 'Afghanistan Time', '+4:30'],
    ['IRDT', 'Iran Daylight Time', '+4:30'],

    ['HMT', 'Heard and McDonald Islands Time', '+5'],
    ['MAWT', 'Mawson Station Time', '+5'],
    ['MVT', 'Maldives Time', '+5'],
    ['ORAT', 'Oral Time', '+5'],
    ['PKT', 'Pakistan Standard Time', '+5'],
    ['TFT', 'Indian/Kerguelen', '+5'],
    ['TJT', 'Tajikistan Time', '+5'],
    ['TMT', 'Turkmenistan Time', '+5'],
    ['UZT', 'Uzbekistan Time', '+5'],
    ['YEKT', 'Yekaterinburg Time', '+5'],

    ['IST', 'Indian Standard Time', '+5:30'],
    ['SLST', 'Sri Lanka Standard Time', '+5:30'],

    ['NPT', 'Nepal Time', '+5:45'],

    ['BIOT', 'British Indian Ocean Time', '+6'],
    ['BST', 'Bangladesh Standard Time', '+6'],
    ['BTT', 'Bhutan Time', '+6'],
    ['KGT', 'Kyrgyzstan time', '+6'],
    ['OMST', 'Omsk Time', '+6'],
    ['VOST', 'Vostok Station Time', '+6'],

    ['CCT', 'Cocos Islands Time', '+6:30'],
    ['MMT', 'Myanmar Standard Time', '+6:30'],

    ['CXT', 'Christmas Island Time', '+7'],
    ['DAVT', 'Davis Time', '+7'],
    ['HOVT', 'Khovd Standard Time', '+7'],
    ['ICT', 'Indochina Time', '+7'],
    ['KRAT', 'Krasnoyarsk Time', '+7'],
    ['THA', 'Thailand Standard Time', '+7'],
    ['WIT', 'Western Indonesian Time', '+7'],

    ['ACT', 'ASEAN Common Time', '+8'],
    ['AWST', 'Australian Western Standard Time', '+8'],
    ['BDT', 'Brunei Time', '+8'],
    ['CHOT', 'Choibalsan Standard Time', '+8'],
    ['CIT', 'Central Indonesia Time', '+8'],
    ['CST', 'China Standard Time', '+8'],
    ['CT', 'China time', '+8'],
    ['HKT', 'Hong Kong Time', '+8'],
    ['IRKT', 'Irkutsk Time', '+8'],
    ['HOVST', 'Khovd Summer Time', '+8'],
    ['MST', 'Malaysia Standard Time', '+8'],
    ['MYT', 'Malaysia Time', '+8'],
    ['PHT', 'Philippine Time', '+8'],
    ['PST', 'Philippine Standard Time', '+8'],
    ['SGT', 'Singapore Time', '+8'],
    ['SST', 'Singapore Standard Time', '+8'],
    ['ULAT', 'Ulaanbaatar Standard Time', '+8'],
    ['WST', 'Western Standard Time', '+8'],

    ['CWST', 'Central Western Standard Time (Australia)', '+8:45'],

    ['CHOST', 'Choibalsan Summer Time', '+9'],
    ['EIT', 'Eastern Indonesian Time', '+9'],
    ['JST', 'Japan Standard Time', '+9'],
    ['KST', 'Korea Standard Time', '+9'],
    ['TLT', 'Timor Leste Time', '+9'],
    ['ULAST', 'Ulaanbaatar Summer Time', '+9'],
    ['YAKT', 'Yakutsk Time', '+9'],

    ['ACST', 'Australian Central Standard Time', '+9:30'],

    ['AEST', 'Australian Eastern Standard Time', '+10'],
    ['CHST', 'Chamorro Standard Time', '+10'],
    ['CHUT', 'Chuuk Time', '+10'],
    ['DDUT', 'Dumont d\'Urville Time', '+10'],
    ['PGT', 'Papua New Guinea Time', '+10'],
    ['VLAT', 'Vladivostok Time', '+10'],

    ['ACDT', 'Australian Central Daylight Savings Time', '+10:30'],
    ['LHST', 'Lord Howe Standard Time', '+10:30'],

    ['AEDT', 'Australian Eastern Daylight Savings Time', '+11'],
    ['BST', 'Bougainville Standard Time', '+11'],
    ['KOST', 'Kosrae Time', '+11'],
    ['LHST', 'Lord Howe Summer Time', '+11'],
    ['MIST', 'Macquarie Island Station Time', '+11'],
    ['NCT', 'New Caledonia Time', '+11'],
    ['NFT', 'Norfolk Time', '+11'],
    ['PONT', 'Pohnpei Standard Time', '+11'],
    ['SAKT', 'Sakhalin Island time', '+11'],
    ['SBT', 'Solomon Islands Time', '+11'],
    ['SRET', 'Srednekolymsk Time', '+11'],
    ['VUT', 'Vanuatu Time', '+11'],

    ['FJT', 'Fiji Time', '+12'],
    ['GILT', 'Gilbert Island Time', '+12'],
    ['PETT', 'Kamchatka Time', '+12'],
    ['MAGT', 'Magadan Time', '+12'],
    ['MHT', 'Marshall Islands', '+12'],
    ['NZST', 'New Zealand Standard Time', '+12'],
    ['TVT', 'Tuvalu Time', '+12'],
    ['WAKT', 'Wake Island Time', '+12'],

    ['CHAST', 'Chatham Standard Time', '+12:45'],

    ['NZDT', 'New Zealand Daylight Time', '+13'],
    ['PHOT', 'Phoenix Island Time', '+13'],
    ['TKT', 'Tokelau Time', '+13'],
    ['TOT', 'Tonga Time', '+13'],

    ['CHADT', 'Chatham Daylight Time', '+13:45'],

    ['LINT', 'Line Islands Time', '+14']
];

const UTC_INDEX = 67;

const timeZoneSelect = document.getElementById('time-zone-select');

const subtractHourButton = document.getElementById('subtract-hour-button');
const subtractMinButton = document.getElementById('subtract-min-button');

const addHourButton = document.getElementById('add-hour-button');
const addMinButton = document.getElementById('add-min-button');

const offsetDisplay = document.getElementById('offset-display');

const setButton = document.getElementById('set-button');

let timeZoneOffset = 0;

let blankIndex = -1;

function updateButtons () {

    subtractHourButton.disabled = timeZoneOffset <= -12 * constants.MINUTES_IN_HOUR;
    subtractMinButton.disabled = timeZoneOffset <= -12 * constants.MINUTES_IN_HOUR;

    addHourButton.disabled = timeZoneOffset >= 14 * constants.MINUTES_IN_HOUR;
    addMinButton.disabled = timeZoneOffset >= 14 * constants.MINUTES_IN_HOUR;

}

function getTimeZoneText (timeZoneOffset) {

    let timeZoneText = 'UTC';

    const timeZoneOffsetHours = timeZoneOffset < 0 ? Math.ceil(timeZoneOffset / constants.MINUTES_IN_HOUR) : Math.floor(timeZoneOffset / constants.MINUTES_IN_HOUR);

    const timeZoneOffsetMins = Math.abs(timeZoneOffset % constants.MINUTES_IN_HOUR);

    timeZoneText += timeZoneOffset < 0 ? '-' : '+';

    timeZoneText += ('00' + Math.abs(timeZoneOffsetHours)).slice(-2) + ':' + ('00' + timeZoneOffsetMins).slice(-2);

    return timeZoneText;

}

function updateOffsetDisplay () {

    offsetDisplay.innerText = getTimeZoneText(timeZoneOffset);

}

function updateTimeZoneSelect () {

    if (timeZoneOffset === 0) {

        timeZoneSelect.selectedIndex = UTC_INDEX;

        return;

    }

    removeBlankOption();

    const options = timeZoneSelect.options;

    for (let i = 0; i < options.length; i++) {

        const timeZoneOptionValue = parseInt(options[i].value);

        if (timeZoneOptionValue === timeZoneOffset) {

            timeZoneSelect.value = timeZoneOffset.toString();

            return;

        }

    }

    addBlankOption();

    timeZoneSelect.value = timeZoneOffset.toString();

}

function checkOffsetValueRange () {

    timeZoneOffset = Math.max(timeZoneOffset, -12 * constants.MINUTES_IN_HOUR);
    timeZoneOffset = Math.min(timeZoneOffset, 14 * constants.MINUTES_IN_HOUR);

}

function updateOffset (diff) {

    timeZoneOffset += diff;
    checkOffsetValueRange();

    updateOffsetDisplay();
    updateTimeZoneSelect();
    updateButtons();

}

subtractHourButton.addEventListener('click', () => {

    updateOffset(-constants.MINUTES_IN_HOUR);

});

subtractMinButton.addEventListener('click', () => {

    updateOffset(-constants.MINUTES_IN_HOUR / 4);

});

addHourButton.addEventListener('click', () => {

    updateOffset(constants.MINUTES_IN_HOUR);

});

addMinButton.addEventListener('click', () => {

    updateOffset(constants.MINUTES_IN_HOUR / 4);

});

setButton.addEventListener('click', () => {

    electron.ipcRenderer.send('set-custom-time-zone', timeZoneOffset);

});

function removeBlankOption () {

    const options = timeZoneSelect.options;

    if (options.length > 0 && blankIndex !== -1) {

        timeZoneSelect.removeChild(options[blankIndex]);
        blankIndex = -1;

    }

}

function addBlankOption () {

    const options = timeZoneSelect.options;

    const blankOpt = document.createElement('option');

    blankOpt.value = timeZoneOffset.toString();
    
    blankOpt.innerHTML = getTimeZoneText(timeZoneOffset);

    for (let i = 0; i < options.length; i++) {

        const timeZoneOptionValue = parseInt(options[i].value);

        if (timeZoneOffset <= timeZoneOptionValue) {

            timeZoneSelect.options.add(blankOpt, options[i]);
            blankIndex = i;
            return;

        }

    }

}

for (let i = 0; i < timeZones.length; i++) {

    const opt = document.createElement('option');

    /* Extract components */

    const acronym = timeZones[i][0];

    const name = timeZones[i][1];
    
    let offsetString = timeZones[i][2];

    if (offsetString.includes(':') === false) offsetString += ':00';

    const offsetSplit = offsetString.split(':');

    const timeZoneOffsetHours = parseInt(offsetSplit[0]);

    const timeZoneOffsetMin = parseInt(offsetSplit[1]);

    const timeZoneOffset = timeZoneOffsetHours < 0 ? timeZoneOffsetHours * constants.MINUTES_IN_HOUR - timeZoneOffsetMin : timeZoneOffsetHours * constants.MINUTES_IN_HOUR + timeZoneOffsetMin;

    /* Generate option text */

    let optionText = getTimeZoneText(timeZoneOffset) +  '   ' + acronym + '   ' + name;
    
    /* Add option to selection */

    opt.innerHTML = optionText;

    opt.value = timeZoneOffset;
    
    timeZoneSelect.appendChild(opt);

}

timeZoneSelect.selectedIndex = UTC_INDEX;

timeZoneSelect.addEventListener('change', () => {

    if (blankIndex !== timeZoneSelect.selectedIndex) {

        removeBlankOption();

    }

    timeZoneOffset = timeZoneSelect.value;

    checkOffsetValueRange();

    updateOffsetDisplay();
    updateButtons();

});

