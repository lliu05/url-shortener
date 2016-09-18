"use strict";

var express = require("express");
var path = require("path");
var validUrl = require("valid-url");
var app = express();
var mongo = require("mongodb").MongoClient;
var mainPage = "https://luna-url-short.herokuapp.com/";
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/url-shortener';

app.use(express.static(path.join(__dirname, 'static/html')));
app.use(express.static(path.join(__dirname, 'static/css')));

//input original url, output json {originalUrl, shortUrl}
app.get("/new/:url*", function (req, res) {
    var original = req.url.slice(5),
        randomNum = Math.floor(Math.random() * 10000) + 1,
        shortened = mainPage + randomNum,
        result = {
            "originalUrl": original,
            "shortUrl": shortened
        };
    if (validUrl.isUri(original)) {
        mongo.connect(mongoUrl, function (err, db) {
            if (err) { throw err; }
            var collection = db.collection("url");
            collection.updateOne({short: randomNum}, {$set: {originalUrl: original}}, {upsert: true}, function (err, data) {
                if (err) { throw err; }
                if (data) { console.log(data); }
                db.close();
            });
        });
        res.send(result);
    } else {
        res.send("Invalid input URL! Please enter a valid URL: http://www.example.com");
    }
});


//input shortened url, direct page to original url page
app.get("/:short", function (req, res) {
    var shortened = parseInt(req.params.short, 10);
    mongo.connect(mongoUrl, function (err, db) {
        if (err) { throw err; }
        var url = db.collection("url");
        url.find({
            short: {
                $eq: shortened
            }
        }).toArray(function (err, docs) {
            if (err) { throw err; }
            console.log(docs);
            if (docs.length !== 0) {
                res.writeHead(302, {
                    'Location': docs[0].originalUrl
                });
            } else {
                res.send({"error": "This url is not on the database or database is still pending"});
            }
            res.end();
            db.close();
        });
    });
});


app.listen(process.env.PORT || 8080);
