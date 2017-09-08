var express = require('express');
var mongodb = require('mongodb');

var app = express();
var MongoClient = mongodb.MongoClient;
var mongodbUrl = ('mongodb://' + process.env.USERNAME + ':'+ process.env.PASSWORD + '@ds129143.mlab.com:29143/shortener');
var host = 'https://ssc-url-shortener.glitch.me/';

// url validating regEX function copied from Ishan Jain answer on 
// https://stackoverflow.com/questions/17726427/check-if-url-is-valid-or-not
 function validURL(string) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
   var test = regexp.test(string);
   if (test){
     return true;
   }else{
     return false;
   }
 }

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/*", function(req, res){
  var url = req.params[0];
  MongoClient.connect(mongodbUrl, function(err, db){
    if (err) throw err;
    var collection = db.collection('websites');
    console.log(url);
    collection.findOne({shortened : parseInt(url)}, function(err, match){
      if (err) throw err;
      if (match){
        res.redirect(match.original);
        db.close();
      }else{
        collection.findOne({original : url}, function(err, doc){
          if (err) throw err;
          if (doc){
            res.json(
              {response : 'ERROR!' + ' A link to ' 
               + url + ' is already stored as ' + doc.shortened
              })
            db.close();
          }else{
            if (validURL(url)){
              collection.count({}, function(err, count){
                if (err) throw err;
                var newDoc = {original : url, shortened : count};
                res.json(newDoc);
                collection.insert(newDoc);
                db.close();
              });
            }else{
          res.json({response : "DEADLY ERROR! " + url + " is not a valid."});
          db.close();
            }
          }
        })
      }
    });
  });
});


app.listen(process.env.PORT);