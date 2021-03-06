/**
 * Created by Andrey Petrov on 15-02-25.
 */

//Email add on
var https = require('https');

var request = require("request");


var API_SERVER = "https://public-api.wordpress.com/rest/v1.1/";

var POSTS_ENDPOINT = API_SERVER + 'sites/andreypetrovblog.wordpress.com/posts?fields=ID,title,content&number=2';
var posts = function (req, res) {
    request(POSTS_ENDPOINT, function(error, response, body) {
        var result = error ? error : body;
        //console.log(body);
        var resultObject = JSON.parse(body);
        res.type('application/json');
        res.send(resultObject);
    });
}

exports.posts = posts;