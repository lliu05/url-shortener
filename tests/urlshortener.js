var request = require('supertest');
var assert = require('assert');
var server = require('../server');

describe('loading express', function () {
    var result = {
        "originalUrl": "http://www.google.com",
        "shortUrl": "https://luna-url-short.herokuapp.com/"
    };
    var shortNumber = null;

    after(function () {
        server.close();
    });

    it('responds to /', function testInstruction(done) {
        request(server).get('/').expect(200, done);
    });

    it('responds to /new/http://www.google.com', function testNew(done) {
        request(server).get('/new/http://www.google.com').expect(200, done).expect(function(res) {
            var jsonResponse = JSON.parse(res.text);
            assert.equal(result.originalUrl, jsonResponse.originalUrl);
            assert.ok(jsonResponse.shortUrl.indexOf(result.shortUrl) > -1);
            var responseSplit = jsonResponse.shortUrl.split('/');
            assert.ok(typeof(parseInt(responseSplit[responseSplit.length-1])) == 'number');

            shortNumber = parseInt(responseSplit[responseSplit.length-1]);
        });
    });

    it('responds to /:short', function testNew(done) {
        request(server).get('/'+shortNumber).expect(302, done).expect(function(res) {
            assert.equal(res.header.location, result.originalUrl);
        });
    });

});