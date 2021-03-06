// require modules
const fs = require('fs');
const archiver = require('archiver');
const logger = require('../config/winston');

class Zip {

  static async createFile(name) {

    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if(err.code==='ENOENT') {
        logger.error(err);
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err;
    });

    let distDir = __dirname + '/../dist/';

    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

    // create a file to stream archive data to.
    var output = fs.createWriteStream(distDir + name + '.zip');

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      logger.debug(archive.pointer() + ' total bytes');
      logger.debug('archiver has been finalized and the output file descriptor has closed.');
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      logger.debug('Data has been drained');
    });

    archive.pipe(output);
    return archive;

  }

  static async createResponse(name, res) {

    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', function(err) {
      res.status(500).send({error: err.message});
    });

    //on stream closed we can end the request
    archive.on('end', function() {
      console.log('Archive wrote %d bytes', archive.pointer());
    });

    //set the archive name
    res.attachment(name + '.zip');

    await archive.pipe(res);
    return archive;

  }

  static async add(archive, string, filename) {

    // append a file from string
    await archive.append(string, { name: filename });

  }

  static async addFile(archive, path, filename) {

    // append a file
    await archive.file(path + filename, { name: filename });

  }

  static async output(archive) {

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    await archive.finalize();

  }

}

module.exports = Zip;
