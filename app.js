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
    var AWS = require('aws-sdk'),
        bodyParser = require('body-parser'),
        express = require('express'),
        app = express(),
        port = process.env.PORT || 3000;

    AWS.config.update({
        region: "us-east-2",
        endpoint: "dynamodb.us-east-2.amazonaws.com"
    });

    AWS.config.apiVersions = {
        dynamodb: '2012-08-10',
    };

    var dynamodb = new AWS.DynamoDB();

    app.use(express.static('static'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.get('/', function (req, res) {
        console.log('Main page request SUCCESS');
        res.sendFile(__dirname + '/static/index.html');
    });

    app.post('/make_order', function (req, res) {
        console.log('POST SUCCESS');
        console.log(req.body);
    });

    app.use(function (req, res, next) {
        console.log('General request SUCCESS');
        console.log(req.url);
        console.log(req.body);
        next();
    });

    app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
