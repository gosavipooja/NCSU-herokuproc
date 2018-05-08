var express = require('express');
const fileUpload = require('express-fileupload');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var server = express();
server.use(fileUpload());
server.use(express.static(__dirname + '/www'));

var port = process.env.PORT || 5000;

/**
 * Connect to database and then start listening on PORT.
 */
MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
  if (err) throw err;
  console.log('Database connected!');
  server.locals.dbo = db.db('heroku_jwvl485z');

  server.listen(port, function () {
    console.log('server started... listening on port ' + port);
  });
});

server.post('/uploadImage', function (req, res) {
  if (!req.files) {
    console.log('No files present in the image request.');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return res.status(400).send('No image files to upload.');
  } else {
    let imgFile = req.files.imgFile;
    if (imgFile) {
      console.log('dummy image response!');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.status(200).send('Dummy response from server for image file:\n' + JSON.stringify(imgFile.name));
    } else {
      console.log('No imgFile present in the image request.');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(400).send('No image files to upload.');
    }
  }
});

server.post('/uploadVideo', function (req, res) {
  if (!req.files) {
    console.log('No files present in the video request.');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return res.status(400).send('No video files to upload.');
  } else {
    let videoFile = req.files.videoFile;
    if (videoFile) {
      console.log('dummy video response!');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.status(200).send('Dummy response from server for file:\n' + JSON.stringify(videoFile.name));
    } else {
      console.log('No videoFile present in the video request.');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(400).send('No video files to upload.');
    }
  }
});

server.post('/uploadAudio', function (req, res) {
  if (!req.files) {
    console.log('No files present in the audio request.');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return res.status(400).send('No audio files to upload.');
  } else {
    let audioFile = req.files.audioFile;
    if (audioFile) {
      console.log('dummy audio response!');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.status(200).send('Dummy response from server for file:\n' + JSON.stringify(audioFile.name));
    } else {
      console.log('No audioFile present in the audio request.');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(400).send('No audio files to upload.');
    }
  }
});

/**
 * This method uploads the file and then saves the file contents to MongoDB.
 */
server.post('/upload', function (req, res) {
  if (!req.files) {
    console.log('No files present in the request.');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    return res.status(400).send('No files to upload.');
  } else {
    // The name of the input field (i.e. "jsonFile") is used to retrieve the uploaded file
    let jsonFile = req.files.jsonFile;
    // Use the mv() method to place the file somewhere on the server
    if (jsonFile) {
      jsonFile.mv('www/data/' + jsonFile.name, function (err) {
        if (err) {
          console.log(err);
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
          return res.status(500).send(err);
        } else {
          var fname = JSON.stringify(jsonFile.name);
          console.log('File: ' + fname + ' Uploaded Successfuly!');
          var data = {};
          readFile('www/data/' + jsonFile.name, function (filename, content) {
            data["name"] = jsonFile.name;
            data[jsonFile.name] = content;
            console.log('File read: ' + jsonFile.name);
            server.locals.dbo.collection("procedures").deleteMany({ name: jsonFile.name }, function (err, obj) {
              if (err) throw err;
              console.log("If file with same name exists in database, it will be overwritten.");
            });
            server.locals.dbo.collection('procedures').insertOne(data, function () {
              if (err) {
                console.log(err);
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                return res.status(500).send(err);
              }
              console.log('File inserted in database!');
              res.header('Access-Control-Allow-Origin', '*');
              res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
              res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
              res.status(200).send('File Uploaded Successfully:\n' + JSON.stringify(jsonFile.name));
            });
          }, function (err) {
            console.log(err);
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            return res.status(500).send(err);
          });
        }
      });
    } else {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      return res.status(400).send('No files to upload.');
    }
  }
});

/**
 * This method reads all the procedures from MongoDB.
 */
server.get('/procList', function (req, res) {
  console.log('Getting Procedure List from the database.');
  getProcList(function (value) {
    if (value) {
      console.log('Got procedure list from database');
      procList = [];
      data = {};
      for (v of value) {
        var n = v.name;
        data[v.name] = v[n];
        procList.push(v.name);
      }
      data.list = procList;
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.status(200).send(data);
    }
  });
});

var getProcList = function (callback) {
  server.locals.dbo.collection('procedures').find().toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length > 0) {
      callback(result);
    }
  });
};

var readFile = function (filename, onFileContent, onError) {
  console.log('reading file:' + filename);
  fs.readFile(filename, 'utf-8', function (err, content) {
    if (err) {
      onError(err);
      return;
    }
    onFileContent(filename, content);
  });
};