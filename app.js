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
        port = process.env.PORT || 3000;

    app.use(express.static('static'));

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/static/index.html');
    });

    app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
