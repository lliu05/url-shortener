var express = require("express");
var path = require("path");
var validUrl = require('valid-url');
var app = express();
var mongo = require("mongodb").MongoClient;
var main_page = "https://luna-url-short.herokuapp.com/";
var mongo_url = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/url-shortener';

//input original url, output json {original_url, short_url}
app.get("/new/:url*", function(req, res) {
    var original = req.url.slice(5);
    console.log(original);
    if (validUrl.isUri(original)){      
        var random_num = Math.floor(Math.random() * 10000) + 1;
        var shortened = main_page + random_num;
        
        var result = {
            "original_url": original,
            "short_url": shortened
        };
        
        mongo.connect(mongo_url, function(err, db) {
            if (err) throw err;
            var collection = db.collection("url");
            collection.updateOne({short: random_num}, {$set: {original_url: original}}, {upsert: true}, function(err, data) {
                if (err) throw err;
                db.close();
            });
        });
        
        res.send(result);
    } 
    else {
        res.send("Invalid input URL! Valid URL form: http://www.example.com")
    }
    
});


//input shortened url, direct page to original url page
app.get("/:short", function(req, res) {
    var shortened = parseInt(req.params.short, 10);
    
    mongo.connect(mongo_url, function(err, db) {
        if (err) throw err;
        var url = db.collection("url");
        url.find({
            short: {
                $eq: shortened
            }
        }).toArray(function(err, docs) {
            if (err) throw err;
            //console.log(docs[0]);
            console.log(docs);
            if (docs) {
                res.writeHead(302, {
                    'Location': docs[0]["original_url"]
                });
            }
            else {
                res.send({"error": "This url is not on the database or database is still pending"});
            }
            res.end();
            db.close();
        });
    });
});


app.listen(process.env.PORT || 8080);
