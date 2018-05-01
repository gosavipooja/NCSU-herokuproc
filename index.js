var express = require('express');
const fileUpload = require('express-fileupload');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var dburl = 'mongodb://localhost:27017/hybrid';

var server = express();
server.use(fileUpload());
server.use(express.static(__dirname + '/www'));

var port = process.env.PORT || 5000;

/**
 * Connect to database and then start listening on PORT.
 */
MongoClient.connect(dburl, function (err, db) {
  if (err) throw err;
  console.log('Database connected!');
  server.locals.dbo = db.db('hybrid');

  server.listen(port, function () {
    console.log('server started... listening on port ' + port);
  });
});

/**
 * This method uploads the file and then saves the file contents to MongoDB.
 */
server.post('/upload', function (req, res) {
  if (!req.files) {
    console.log('No files present in the request.');
    return res.status(400).send('No files to upload.');
  } else {
    // The name of the input field (i.e. "jsonFile") is used to retrieve the uploaded file
    let jsonFile = req.files.jsonFile;
    // Use the mv() method to place the file somewhere on the server
    if (jsonFile) {
      jsonFile.mv('temp/' + jsonFile.name, function (err) {
        if (err) {
          console.log(err);
          return res.status(500).send(err);
        } else {
          var fname = JSON.stringify(jsonFile.name);
          console.log('File: ' + fname + ' Uploaded Successfuly!');
          var data = {};
          readFile('temp/' + jsonFile.name, function (filename, content) {
            data["name"] = jsonFile.name;
            data[jsonFile.name] = content;
            console.log('File read: ' + jsonFile.name);
            server.locals.dbo.collection("procedures").deleteMany({name: jsonFile.name}, function (err, obj) {
              if (err) throw err;
              console.log("If file with same name exists in database, it will be overwritten.");
            });
            server.locals.dbo.collection('procedures').insertOne(data, function () {
              if (err) {
                console.log(err);
                return res.status(500).send(err);
              }
              console.log('File inserted in database!');
              res.status(200).send('File Uploaded Successfully:\n' + JSON.stringify(jsonFile.name));
            });
          }, function (err) {
            console.log(err);
            return res.status(500).send(err);
          });
        }
      });
    } else {
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