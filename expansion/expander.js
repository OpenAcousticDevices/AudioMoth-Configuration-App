/****************************************************************************
 * expander.js
 * openacousticdevices.info
 * June 2020
 *****************************************************************************/

'use strict';

const fs = require('fs');
const path = require('path');

const wavHeader = require('./wavHeader.js');

/* Expansion constants */

const MILLISECONDS_IN_SECONDS = 1000;

const NUMBER_OF_BYTES_IN_SAMPLE = 2;

const EXPANSION_BUFFER_ENCODING_SIZE = 32;

const EXPANSION_BUFFER_SIZE_IN_BYTES = 512;

const SECONDS_IN_DAY = 24 * 60 * 60;

const DATE_REGEX = /Recorded at (\d\d):(\d\d):(\d\d) (\d\d)\/(\d\d)\/(\d\d\d\d)/;

/* Buffers for reading data */

const headerBuffer = Buffer.alloc(wavHeader.LENGTH_OF_WAV_HEADER);

const blankHeaderBuffer = Buffer.alloc(wavHeader.LENGTH_OF_WAV_HEADER);

const fileBuffer = Buffer.alloc(EXPANSION_BUFFER_SIZE_IN_BYTES);

const blankFileBuffer = Buffer.alloc(EXPANSION_BUFFER_SIZE_IN_BYTES);

/* Decode the expansion buffer */

function decodeExpansionBuffer (buffer) {

    var i, value, numberOfExpandedBuffers;

    numberOfExpandedBuffers = 0;

    for (i = 0; i < EXPANSION_BUFFER_ENCODING_SIZE; i += 1) {

        value = buffer.readInt16LE(NUMBER_OF_BYTES_IN_SAMPLE * i);

        if (value === 1) {

            numberOfExpandedBuffers += (1 << i);

        } else if (value !== -1) {

            return 0;

        }

    }

    for (i = EXPANSION_BUFFER_ENCODING_SIZE; i < EXPANSION_BUFFER_SIZE_IN_BYTES / NUMBER_OF_BYTES_IN_SAMPLE; i += 1) {

        value = buffer.readInt16LE(NUMBER_OF_BYTES_IN_SAMPLE * i);

        if (value !== 0) {

            return 0;

        }

    }

    return numberOfExpandedBuffers;

}

/* Date functions */

function twoDigits (value) {

    var string = '00' + value;
    return string.substr(string.length - 2);

}

function formatFilename (timestamp) {

    var date = new Date(timestamp);

    return date.getUTCFullYear() + twoDigits(date.getUTCMonth() + 1) + twoDigits(date.getUTCDate()) + '_' + twoDigits(date.getUTCHours()) + twoDigits(date.getUTCMinutes()) + twoDigits(date.getUTCSeconds()) + '.WAV';

}

function formatCommentDate (timestamp) {

    var date = new Date(timestamp);

    return 'Recorded at ' + twoDigits(date.getUTCHours()) + ':' + twoDigits(date.getUTCMinutes()) + ':' + twoDigits(date.getUTCSeconds()) + ' ' + twoDigits(date.getUTCDate()) + '/' + twoDigits(date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();

}

/* Expand a T.WAV file */

function expand (inputPath, maximumFileDuration, callback) {

    var fi, fo, fileSize, header, headerCheck, progress, inputFileDataSize, aligned, regex, filename, timestamp, outputPath, fileIsOpen, numberOfBytes, numberOfInputBytes, numberOfBlankBytes, inputFileBytesRead, numberOfBytesWritten, numberOfDeferredBlankBytes, numberOfInputBytesAlreadyWritten, bytesToWriteInEachOutputFile;

    /* Check parameter */

    maximumFileDuration = maximumFileDuration || SECONDS_IN_DAY;

    if (maximumFileDuration !== Math.round(maximumFileDuration)) {

        return {
            success: false,
            error: 'Maximum file duration must be an integer.'
        };

    }

    if (maximumFileDuration <= 0) {

        return {
            success: false,
            error: 'Maximum file duration must be greater than zero.'
        };

    }

    /* Generate the output filename */

    if (!inputPath.includes('T.wav') && !inputPath.includes('T.WAV')) {

        return {
            success: false,
            error: 'File name is incorrect.'
        };

    }

    /* Open input file */

    try {

        fi = fs.openSync(inputPath, 'r');

    } catch (e) {

        return {
            success: false,
            error: 'Could not open input file.'
        };

    }

    /* Find the input file size */

    try {

        fileSize = fs.statSync(inputPath).size;

    } catch (e) {

        return {
            success: false,
            error: 'Could not read input file size.'
        };

    }

    if (fileSize === 0) {

        return {
            success: false,
            error: 'Input file has zero size.'
        };

    }

    if (fileSize <= wavHeader.LENGTH_OF_WAV_HEADER) {

        return {
            success: false,
            error: 'Input file is too small.'
        };

    }

    /* Read the header */

    try {

        fs.readSync(fi, headerBuffer, 0, wavHeader.LENGTH_OF_WAV_HEADER, null);

    } catch (e) {

        return {
            success: false,
            error: 'Could not read the input WAV header.'
        };

    }

    /* Check the header */

    header = wavHeader.readHeader(headerBuffer);

    headerCheck = wavHeader.checkHeader(header, fileSize);

    if (headerCheck.success === false) {

        return {
            success: false,
            error: headerCheck.error
        };

    }

    /* Check the header comment format */

    if (header.icmt.comment.search(DATE_REGEX) !== 0) {

        return {
            success: false,
            error: 'Comment format is incorrect.'
        };

    }

    /* Read the timestamp from the header */

    regex = DATE_REGEX.exec(header.icmt.comment);

    timestamp = Date.UTC(regex[6], regex[5] - 1, regex[4], regex[1], regex[2], regex[3]);

    filename = formatFilename(timestamp);

    outputPath = path.join(path.parse(inputPath).dir, filename);

    /* Read determine settings from the input file */

    inputFileDataSize = header.data.size;

    bytesToWriteInEachOutputFile = NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond * maximumFileDuration;

    /* Set up to process the file */

    progress = 10;

    aligned = false;

    fileIsOpen = false;

    inputFileBytesRead = 0;

    numberOfBytesWritten = 0;

    numberOfDeferredBlankBytes = 0;

    /* Main loop */

    try {

        while (inputFileBytesRead < inputFileDataSize) {

            if (inputFileBytesRead / inputFileDataSize > progress / 100) {

                if (callback) callback(progress);

                progress += 10;

            }

            /* Determine number of bytes to read */

            numberOfBytes = aligned ? Math.min(inputFileDataSize - inputFileBytesRead, EXPANSION_BUFFER_SIZE_IN_BYTES) : EXPANSION_BUFFER_SIZE_IN_BYTES - wavHeader.LENGTH_OF_WAV_HEADER;

            aligned = true;

            /* Read the data from the input file */

            fs.readSync(fi, fileBuffer, 0, numberOfBytes, null);

            inputFileBytesRead += numberOfBytes;

            /* Check if this is a normal buffer or an encoded buffer */

            if (numberOfBytes === EXPANSION_BUFFER_SIZE_IN_BYTES) {

                numberOfBlankBytes = EXPANSION_BUFFER_SIZE_IN_BYTES * decodeExpansionBuffer(fileBuffer);
                numberOfInputBytes = numberOfBlankBytes > 0 ? 0 : EXPANSION_BUFFER_SIZE_IN_BYTES;

            } else {

                numberOfBlankBytes = 0;
                numberOfInputBytes = numberOfBytes;

            }

            /* Process these input bytes */

            numberOfInputBytesAlreadyWritten = 0;

            while (numberOfBlankBytes > 0 || numberOfInputBytes > 0) {

                if (numberOfBlankBytes > 0) {

                    if (fileIsOpen) {

                        numberOfBytes = Math.min(numberOfBlankBytes, bytesToWriteInEachOutputFile - numberOfBytesWritten);

                        numberOfBytesWritten += numberOfBytes;

                        numberOfBlankBytes -= numberOfBytes;

                        while (numberOfBytes > 0) {

                            fs.writeSync(fo, blankFileBuffer, 0, Math.min(numberOfBytes, EXPANSION_BUFFER_SIZE_IN_BYTES), null);

                            numberOfBytes -= Math.min(numberOfBytes, EXPANSION_BUFFER_SIZE_IN_BYTES);

                        }

                    } else {

                        numberOfBytes = Math.min(numberOfBlankBytes, bytesToWriteInEachOutputFile - numberOfDeferredBlankBytes);

                        numberOfDeferredBlankBytes += numberOfBytes;

                        numberOfBlankBytes -= numberOfBytes;

                    }

                }

                if (numberOfInputBytes > 0) {

                    if (fileIsOpen) {

                        numberOfBytes = Math.min(numberOfInputBytes, bytesToWriteInEachOutputFile - numberOfBytesWritten, EXPANSION_BUFFER_SIZE_IN_BYTES - numberOfInputBytesAlreadyWritten);

                        fs.writeSync(fo, fileBuffer, numberOfInputBytesAlreadyWritten, numberOfBytes);

                        numberOfInputBytesAlreadyWritten += numberOfBytes;

                        numberOfBytesWritten += numberOfBytes;

                        numberOfInputBytes -= numberOfBytes;

                    } else {

                        fo = fs.openSync(outputPath, 'w');

                        fs.writeSync(fo, blankHeaderBuffer, 0, wavHeader.LENGTH_OF_WAV_HEADER, null);

                        fileIsOpen = true;

                        numberOfBlankBytes += numberOfDeferredBlankBytes;

                        numberOfDeferredBlankBytes = 0;

                        continue;

                    }

                }

                if (inputFileBytesRead === inputFileDataSize || numberOfBytesWritten === bytesToWriteInEachOutputFile || numberOfDeferredBlankBytes === bytesToWriteInEachOutputFile) {

                    /* Write header and close file if it has been opened */

                    if (fileIsOpen === true) {

                        wavHeader.updateDataSize(header, numberOfBytesWritten);

                        wavHeader.overwriteComment(header, formatCommentDate(timestamp));

                        wavHeader.writeHeader(headerBuffer, header);

                        fs.writeSync(fo, headerBuffer, 0, wavHeader.LENGTH_OF_WAV_HEADER, 0);

                        fs.closeSync(fo);

                    }

                    /* Reset for next file */

                    numberOfBytesWritten = 0;

                    numberOfDeferredBlankBytes = 0;

                    timestamp += maximumFileDuration * MILLISECONDS_IN_SECONDS;

                    filename = formatFilename(timestamp);

                    outputPath = path.join(path.parse(inputPath).dir, filename);

                    fileIsOpen = false;

                }

            }

        }

        fs.closeSync(fi);

    } catch (e) {

        return {
            success: false,
            error: 'Error occurred while processing file. ' + e
        };

    }

    if (callback) {

        callback(100);

    }

    /* Return success */

    return {
        success: true,
        error: null
    };

}

/* Export expand */

exports.expand = expand;
