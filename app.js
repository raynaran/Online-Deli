/* var cluster = require('cluster');

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    cluster.on('exit', function (worker) {
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
} else {} */

var AWS = require('aws-sdk'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    express = require('express'),
    session = require('express-session'),
    app = express(),
    port = process.env.PORT || 3000;

AWS.config.region = process.env.REGION;

AWS.config.apiVersions = {
    dynamodb: '2012-08-10',
};

var ddb_doc = new AWS.DynamoDB.DocumentClient();
var table = "OrderTable";
var food = ['Hamburger', 'Fries', 'Wings', 'Cookie', 'Salads', 'Orange Juice'];

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: "Online-Deli",
    resave: false,
    saveUninitialized: false,
}));

app.use(function (req, res, next) {
        console.log('Authorizing ' + req.url);

        if (req.url === '/admin.html' || req.url === '/SearchFeedback.html'
            || req.url === 'SearchInventory.html') {
            if (req.session && req.session.authenticated) {
                res.sendFile(__dirname + '/private' + req.url);
            } else {
                res.sendStatus(404);
            }

            return;
        }

        next();
    }
);

app.get('/', function (req, res) {
    res.redirect('/index.html');
});

app.get('/logout', function (req, res, next) {
    delete req.session.authenticated;
    res.redirect('/index.html');
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

app.post('/validate', function (req, res) {
    console.log('POST SUCCESS');
    console.log(req.body);

    if (req.body.email && req.body.email === "abc@gmail.com" &&
        req.body.password && req.body.password === "123") {
        req.session.authenticated = true;
        res.redirect('/admin.html');
    } else {
        res.sendStatus(403);
    }
});

app.post('/feedback', function (req, res) {
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
