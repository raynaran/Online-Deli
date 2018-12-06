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

    AWS.config.region = process.env.REGION;

    AWS.config.apiVersions = {
        dynamodb: '2012-08-10',
    };

    var ddb_doc = new AWS.DynamoDB.DocumentClient();
    var table = "OrderTable";
    var food = ['Hamburger', 'Fries', 'Wings', 'Cookie', 'Salads', 'Orange Juice'];

    app.use(express.static('static'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/static/index.html');
    });

    app.post('/make_order', function (req, res) {
        console.log('POST SUCCESS');

        var order = {
            "orderID": req.body["orderID"],
            "Address": req.body["Address"],
            "Total Before Tax": req.body["Total Before Tax"],
            "Tax": req.body["Tax"],
            "Total": req.body["Total"],
            "Feedback": req.body["Feedback"]
        };

        for (var i = 0; i < food.length; i++) {
            if (req.body.hasOwnProperty(food[i])) {
                order[food[i]] = req.body[food[i]];
            }
        }

        var params = {
            TableName: table,
            Item: order
        };

        ddb_doc.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add item");
            } else {
                console.log("Added item");
            }
        });
    });

    app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
