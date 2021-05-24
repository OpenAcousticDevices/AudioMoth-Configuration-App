/****************************************************************************
 * wavHeader.js
 * openacousticdevices.info
 * June 2020
 *****************************************************************************/

'use strict';

/* WAV header constants */

const UINT16_LENGTH = 2;
const UINT32_LENGTH = 4;
const RIFF_ID_LENGTH = 4;

/* WAV format constants */

const PCM_FORMAT = 1;
const NUMBER_OF_CHANNELS = 1;
const NUMBER_OF_BITS_IN_SAMPLE = 16;
const NUMBER_OF_BYTES_IN_SAMPLE = 2;

/* WAV header base component read functions */

function readString (state, length) {

    if (state.buffer.length - state.index < length) throw new Error('WAVE header exceeded buffer length.');

    var result = state.buffer.toString('utf8', state.index, state.index + length).replace(/\0/g, '');
    state.index += length;
    return result;

}

function readUInt32LE (state) {

    if (state.buffer.length - state.index < UINT32_LENGTH) throw new Error('WAVE header exceeded buffer length.');

    var result = state.buffer.readUInt32LE(state.index);
    state.index += UINT32_LENGTH;
    return result;

}

function readUInt16LE (state) {

    if (state.buffer.length - state.index < UINT16_LENGTH) throw new Error('WAVE header exceeded buffer length.');

    var result = state.buffer.readUInt16LE(state.index);
    state.index += UINT16_LENGTH;
    return result;

}

/* WAV header high-level component read functions */

function readID (state, id) {

    const result = readString(state, id.length);

    if (result !== id) throw new Error('Could not find ' + id + ' ID.');

    return result;

}

function readChunk (state, id) {

    const result = {};

    result.id = readString(state, RIFF_ID_LENGTH);

    if (result.id !== id) throw new Error('Could not find ' + id.replace(' ', '') + ' chunk ID.');

    result.size = readUInt32LE(state);

    return result;

}

/* WAV header component write functions */

function writeString (state, string, length, zeroTerminated) {

    const maximumWriteLength = zeroTerminated ? Math.min(string.length, length - 1) : Math.min(string.length, length);
    state.buffer.fill(0, state.index, state.index + length);
    state.buffer.write(string, state.index, maximumWriteLength, 'utf8');
    state.index += length;

}

function writeUInt32LE (state, value) {

    state.buffer.writeUInt32LE(value, state.index);
    state.index += UINT32_LENGTH;

}

function writeUInt16LE (state, value) {

    state.buffer.writeUInt16LE(value, state.index);
    state.index += UINT16_LENGTH;

}

function writeChunk (state, chunk) {

    writeString(state, chunk.id, RIFF_ID_LENGTH, false);
    writeUInt32LE(state, chunk.size);

}

/* WAV header read and write functions */

function readHeader (buffer, fileSize) {

    const header = {};

    const state = {buffer: buffer, index: 0};

    try {

        /* Read RIFF chunk */

        header.riff = readChunk(state, 'RIFF');

        if (header.riff.size + RIFF_ID_LENGTH + UINT32_LENGTH !== fileSize) {

            return {
                success: false,
                error: 'RIFF chunk size does not match file size.'
            };

        }

        /* Read WAVE ID */

        header.format = readID(state, 'WAVE');

        /* Read FMT chunk */

        header.fmt = readChunk(state, 'fmt ');

        header.wavFormat = {};
        header.wavFormat.format = readUInt16LE(state);
        header.wavFormat.numberOfChannels = readUInt16LE(state);
        header.wavFormat.samplesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerSecond = readUInt32LE(state);
        header.wavFormat.bytesPerCapture = readUInt16LE(state);
        header.wavFormat.bitsPerSample = readUInt16LE(state);

        if (header.wavFormat.format !== PCM_FORMAT || header.wavFormat.numberOfChannels !== NUMBER_OF_CHANNELS || header.wavFormat.bytesPerSecond !== NUMBER_OF_BYTES_IN_SAMPLE * header.wavFormat.samplesPerSecond || header.wavFormat.bytesPerCapture !== NUMBER_OF_BYTES_IN_SAMPLE || header.wavFormat.bitsPerSample !== NUMBER_OF_BITS_IN_SAMPLE) {

            return {
                success: false,
                error: 'Unexpected WAVE format.'
            };

        }

        /* Read LIST chunk */

        header.list = readChunk(state, 'LIST');

        /* Read INFO ID */

        header.info = readID(state, 'INFO');

        /* Read ICMT chunk */

        header.icmt = readChunk(state, 'ICMT');

        header.icmt.comment = readString(state, header.icmt.size);

        /* Read IART chunk */

        header.iart = readChunk(state, 'IART');

        header.iart.artist = readString(state, header.iart.size);

        /* Check LIST chunk size */

        if (header.list.size !== 3 * RIFF_ID_LENGTH + 2 * UINT32_LENGTH + header.iart.size + header.icmt.size) {

            return {
                success: false,
                error: 'LIST chunk size does not match total size of INFO, ICMT and IART chunks.'
            };

        }

        /* Read DATA chunk */

        header.data = readChunk(state, 'data');

        /* Set the header size and check DATA chunk size */

        header.size = state.index;

        if (header.data.size + header.size !== fileSize) {

            return {
                success: false,
                error: 'DATA chunk size does not match file size.'
            };

        }

        /* Success */

        return {
            header: header,
            success: true,
            error: null
        };

    } catch (e) {

        /* Header has exceed file buffer length */

        return {
            success: false,
            error: e.message
        };

    }

}

function writeHeader (buffer, header) {

    const state = {buffer: buffer, index: 0};

    writeChunk(state, header.riff);

    writeString(state, header.format, RIFF_ID_LENGTH, false);

    writeChunk(state, header.fmt);

    writeUInt16LE(state, header.wavFormat.format);
    writeUInt16LE(state, header.wavFormat.numberOfChannels);
    writeUInt32LE(state, header.wavFormat.samplesPerSecond);
    writeUInt32LE(state, header.wavFormat.bytesPerSecond);
    writeUInt16LE(state, header.wavFormat.bytesPerCapture);
    writeUInt16LE(state, header.wavFormat.bitsPerSample);

    writeChunk(state, header.list);

    writeString(state, header.info, RIFF_ID_LENGTH, false);

    writeChunk(state, header.icmt);
    writeString(state, header.icmt.comment, header.icmt.size, true);

    writeChunk(state, header.iart);
    writeString(state, header.iart.artist, header.iart.size, true);

    writeChunk(state, header.data);

    return buffer;

}

/* Functions to update header */

function updateDataSize (header, size) {

    header.riff.size = header.size + size - UINT32_LENGTH - RIFF_ID_LENGTH;

    header.data.size = size;

}

function updateComment (header, comment) {

    header.icmt.comment = comment;

}

function overwriteComment (header, comment) {

    var length = Math.min(comment.length, header.icmt.size - 1);

    header.icmt.comment = comment.substr(0, length) + header.icmt.comment.substr(length);

}

/* Exports */

exports.writeHeader = writeHeader;
exports.readHeader = readHeader;
exports.updateDataSize = updateDataSize;
exports.updateComment = updateComment;
exports.overwriteComment = overwriteComment;
