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
const LENGTH_OF_ARTIST = 32;
const LENGTH_OF_COMMENT = 384;
const LENGTH_OF_WAV_HEADER = 488;

/* WAV header component read functions */

function readString (state, length) {

    var result = state.buffer.toString('utf8', state.index, state.index + length).replace(/\0/g, '');
    state.index += length;
    return result;

}

function readUInt32LE (state) {

    var result = state.buffer.readUInt32LE(state.index);
    state.index += UINT32_LENGTH;
    return result;

}

function readUInt16LE (state) {

    var result = state.buffer.readUInt16LE(state.index);
    state.index += UINT16_LENGTH;
    return result;

}

function readChunk (state) {

    var result = {};
    result.id = readString(state, RIFF_ID_LENGTH);
    result.size = readUInt32LE(state);
    return result;

}

/* WAV header component write functions */

function writeString (state, string, length, zeroTerminated) {

    var maximumWriteLength = zeroTerminated ? Math.min(string.length, length - 1) : Math.min(string.length, length);
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

function readHeader (buffer) {

    var state, header;

    header = {};

    state = {buffer: buffer, index: 0};

    header.riff = readChunk(state);

    header.format = readString(state, RIFF_ID_LENGTH);

    header.fmt = readChunk(state);

    header.wavFormat = {};
    header.wavFormat.format = readUInt16LE(state);
    header.wavFormat.numberOfChannels = readUInt16LE(state);
    header.wavFormat.samplesPerSecond = readUInt32LE(state);
    header.wavFormat.bytesPerSecond = readUInt32LE(state);
    header.wavFormat.bytesPerCapture = readUInt16LE(state);
    header.wavFormat.bitsPerSample = readUInt16LE(state);

    header.list = readChunk(state);

    header.info = readString(state, RIFF_ID_LENGTH);

    header.icmt = readChunk(state);
    header.icmt.comment = readString(state, LENGTH_OF_COMMENT);

    header.iart = readChunk(state);
    header.iart.artist = readString(state, LENGTH_OF_ARTIST);

    header.data = readChunk(state);

    return header;

}

function writeHeader (buffer, header) {

    var state = {buffer: buffer, index: 0};

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
    writeString(state, header.icmt.comment, LENGTH_OF_COMMENT, true);

    writeChunk(state, header.iart);
    writeString(state, header.iart.artist, LENGTH_OF_ARTIST, true);

    writeChunk(state, header.data);

    return buffer;

}

/* Function to check header */

function checkHeader (header, fileSize) {

    if (header.riff.id !== 'RIFF') {

        return {
            success: false,
            error: 'Could not find RIFF chunk in the input file.'
        };

    }

    if (header.riff.size + RIFF_ID_LENGTH + UINT32_LENGTH !== fileSize) {

        return {
            success: false,
            error: 'RIFF chunk file size is incorrect.'
        };

    }

    if (header.format !== 'WAVE') {

        return {
            success: false,
            error: 'Could not find WAVE format indicator in the input file.'
        };

    }

    if (header.fmt.id !== 'fmt ') {

        return {
            success: false,
            error: 'Could not find fmt segment in the input file.'
        };

    }

    if (header.icmt.id !== 'ICMT') {

        return {
            success: false,
            error: 'Could not find comment segment in the input file.'
        };

    }

    if (header.data.id !== 'data') {

        return {
            success: false,
            error: 'Could not find data segment in the input file.'
        };

    }

    if (header.data.size + LENGTH_OF_WAV_HEADER !== fileSize) {

        return {
            success: false,
            error: 'DATA chunk file size is incorrect.'
        };

    }

    return {
        success: true,
        error: null
    };

}

/* Functions to update header */

function updateDataSize (header, size) {

    header.riff.size = LENGTH_OF_WAV_HEADER + size - UINT32_LENGTH - RIFF_ID_LENGTH;

    header.data.size = size;

}

function overwriteComment (header, comment) {

    var length = Math.min(comment.length, LENGTH_OF_COMMENT - 1);

    header.icmt.comment = comment.substr(0, length) + header.icmt.comment.substr(length);

}

/* Exports */

exports.LENGTH_OF_WAV_HEADER = LENGTH_OF_WAV_HEADER;
exports.writeHeader = writeHeader;
exports.readHeader = readHeader;
exports.checkHeader = checkHeader;
exports.updateDataSize = updateDataSize;
exports.overwriteComment = overwriteComment;
