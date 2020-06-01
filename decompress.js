'use strict';

const fs = require('fs');

/* WAV header constants */

const CHUNK_SIZE_IN_BYTES = 8;

const CHUNK_ID_SIZE_IN_BYTES = 4;
const CHUNK_UINT32_SIZE_IN_BYTES = 4;

const HEADER_RIFF_NAME_START = 0;
const HEADER_RIFF_NAME_END = 4;

const HEADER_FORMAT_NAME_START = 8;
const HEADER_FORMAT_NAME_END = 12;

/* Compression constants */

const NUMBER_OF_BYTES_IN_SAMPLE = 2;
const COMPRESSION_BUFFER_SIZE_IN_BYTES = 512;

/* Buffers for reading data */

const fileBuffer = Buffer.alloc(COMPRESSION_BUFFER_SIZE_IN_BYTES);

const blankBuffer = Buffer.alloc(COMPRESSION_BUFFER_SIZE_IN_BYTES);

const headerBuffer = Buffer.alloc(COMPRESSION_BUFFER_SIZE_IN_BYTES);

/* Decode the compression buffer */

function decodeCompressionBuffer (buffer) {

    var i, value, numberOfCompressedBuffers;

    numberOfCompressedBuffers = 0;

    for (i = 0; i < 32; i += 1) {

        value = buffer.readInt16LE(2 * i);

        if (value === 1) {

            numberOfCompressedBuffers += (1 << i);

        } else if (value !== -1) {

            return 0;

        }

    }

    for (i = 32; i < COMPRESSION_BUFFER_SIZE_IN_BYTES / NUMBER_OF_BYTES_IN_SAMPLE; i += 1) {

        value = buffer.readInt16LE(2 * i);

        if (value !== 0) {

            return 0;

        }

    }

    return numberOfCompressedBuffers;

}

/* Decompress a T.WAV file */

function decompress (path) {

    var i, fi, fo, size, fileSize, newPath, bytesRead, dataChunkSizeLocation, numberOfCompressedBuffers, totalNumberOfCompressedBytes;

    /* Generate the output filename */

    if (path.includes('T.wav')) {

        newPath = path.replace('T.wav', '.wav');

    } else if (path.includes('T.WAV')) {

        newPath = path.replace('T.WAV', '.WAV');

    } else {

        return {
            success: false,
            error: 'File name is incorrect.'
        };

    }

    /* Open input file */

    try {

        fi = fs.openSync(path, 'r');

    } catch (e) {

        return {
            success: false,
            error: 'Could not open input file.'
        };

    }

    /* Find the input file size */

    try {

        fileSize = fs.statSync(path).size;

    } catch (e) {

        return {
            success: false,
            error: 'Could not read input file size.'
        };

    }

    if (fileSize === 0) {

        return {
            success: false,
            error: 'Zero size input file.'
        };

    }

    /* Copy the first file sector */

    try {

        fs.readSync(fi, fileBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

        fileBuffer.copy(headerBuffer, 0, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES);

    } catch (e) {

        return {
            success: false,
            error: 'Could not read the input file header.'
        };

    }

    /* Check the header */

    if (headerBuffer.toString('utf8', HEADER_RIFF_NAME_START, HEADER_RIFF_NAME_END) !== 'RIFF') {

        return {
            success: false,
            error: 'Could not find RIFF chunk in the input file.'
        };

    }

    if (headerBuffer.readUInt32LE(HEADER_RIFF_NAME_END) + CHUNK_SIZE_IN_BYTES !== fileSize) {

        return {
            success: false,
            error: 'RIFF chunk file size is incorrect.'
        };

    }

    if (headerBuffer.toString('utf8', HEADER_FORMAT_NAME_START, HEADER_FORMAT_NAME_END) !== 'WAVE') {

        return {
            success: false,
            error: 'Could not find WAVE format indicator in the input file.'
        };

    }

    /* Find the data segment */

    dataChunkSizeLocation = HEADER_FORMAT_NAME_END;

    while (headerBuffer.toString('utf8', dataChunkSizeLocation, dataChunkSizeLocation + CHUNK_ID_SIZE_IN_BYTES) !== 'data' && dataChunkSizeLocation < COMPRESSION_BUFFER_SIZE_IN_BYTES) {

        dataChunkSizeLocation += CHUNK_ID_SIZE_IN_BYTES;

        dataChunkSizeLocation += CHUNK_UINT32_SIZE_IN_BYTES + headerBuffer.readUInt32LE(dataChunkSizeLocation);

    }

    dataChunkSizeLocation += CHUNK_ID_SIZE_IN_BYTES;

    /* Check the data segment size */

    if (dataChunkSizeLocation >= COMPRESSION_BUFFER_SIZE_IN_BYTES) {

        return {
            success: false,
            error: 'Could not find DATA chunk in the input file.'
        };

    }

    if (headerBuffer.readUInt32LE(dataChunkSizeLocation) + dataChunkSizeLocation + CHUNK_ID_SIZE_IN_BYTES !== fileSize) {

        return {
            success: false,
            error: 'DATA chunk file size is incorrect.'
        };

    }

    /* Open output file */

    try {

        fo = fs.openSync(newPath, 'w');

    } catch (e) {

        return {
            success: false,
            error: 'Could not open output file.'
        };

    }

    /* Copy the first file sector */

    try {

        fs.writeSync(fo, fileBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

    } catch (e) {

        return {
            success: false,
            error: 'Could not write the output file header.'
        };

    }

    /* Read the rest of the sectors */

    try {

        totalNumberOfCompressedBytes = 0;

        bytesRead = fs.readSync(fi, fileBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

        while (bytesRead === COMPRESSION_BUFFER_SIZE_IN_BYTES) {

            numberOfCompressedBuffers = decodeCompressionBuffer(fileBuffer);

            if (numberOfCompressedBuffers > 0) {

                totalNumberOfCompressedBytes += (numberOfCompressedBuffers - 1) * COMPRESSION_BUFFER_SIZE_IN_BYTES;

                for (i = 0; i < numberOfCompressedBuffers; i += 1) {

                    fs.writeSync(fo, blankBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

                }

            } else {

                fs.writeSync(fo, fileBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

            }

            bytesRead = fs.readSync(fi, fileBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, null);

        }

        fs.writeSync(fo, fileBuffer, 0, bytesRead, null);

        /* Update header */

        size = headerBuffer.readUInt32LE(HEADER_RIFF_NAME_END);

        size += totalNumberOfCompressedBytes;

        headerBuffer.writeUInt32LE(size, HEADER_RIFF_NAME_END);

        size = headerBuffer.readUInt32LE(dataChunkSizeLocation);

        size += totalNumberOfCompressedBytes;

        headerBuffer.writeUInt32LE(size, dataChunkSizeLocation);

        fs.writeSync(fo, headerBuffer, 0, COMPRESSION_BUFFER_SIZE_IN_BYTES, 0);

        /* Close both files */

        fs.closeSync(fi);
        fs.closeSync(fo);

    } catch (e) {

        return {
            success: false,
            error: 'Error occurred while processing file. ' + e
        };

    }

    /* Return success */

    return {
        success: true,
        error: null
    };

}

/* Export decompress */

exports.decompress = decompress;
