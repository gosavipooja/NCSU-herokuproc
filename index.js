var express = require('express');
const fileUpload = require('express-fileupload');
var fs = require('fs');

var server = express();

server.use(fileUpload());

server.use(express.static(__dirname + '/www'));

var port = process.env.PORT || 5000;

server.get('/procs', function (req, res) {
  var i = 0;
  console.log('getting procs')
  var data = {};
  readFiles('www/data/', function (filename, content, filenames) {
    data[filename] = content;
    data['list'] = filenames;
    console.log('received file #' + ++i);
    if (i == filenames.length) {
      res.send(data);
    }
  }, function (err) {
    throw err;
  });
});

server.post('/upload', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files to upload.');

  // The name of the input field (i.e. "jsonFile") is used to retrieve the uploaded file
  let jsonFile = req.files.jsonFile;

  // Use the mv() method to place the file somewhere on the server
  if (jsonFile) {
    jsonFile.mv('www/data/' + jsonFile.name, function (err) {
      if (err)
        return res.status(500).send(err);
  
      res.send('File Uploaded Successfully:\n'+JSON.stringify(jsonFile.name));
    });
  } else {
    return res.status(400).send('No files to upload.');
  }
  
});

var readFiles = function (dirname, onFileContent, onError) {
  console.log('reading files.');
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function (filename) {
      fs.readFile(dirname + filename, 'utf-8', function (err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content, filenames);
      });
    });
  });
}

server.listen(port, function () {
  console.log('server started... listening on port ' + port);
});