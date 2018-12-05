var cluster = require('cluster');

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    cluster.on('exit', function (worker) {
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
} else {
    //var AWS = require('aws-sdk');
    var express = require('express'),
        app = express(),
        bodyParser = require('body-parser'),
        port = process.env.PORT || 3000;

    app.use(express.static('static'));
    app.use(bodyParser.urlencoded({extended: false}));

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/static/index.html');
    });

    app.post('/a.html', function (req, res) {
        console.log('Post Succesful');
        console.log(req.body);
    });

    app.use(function (req, res, next) {
        console.log(req.url);
        console.log(req.body);
        next();
    });

    app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
