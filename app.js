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

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: "Online-Deli",
    resave: false,
    saveUninitialized: false,
}));

var sendSearchFeedback = function (res) {
    var params = {TableName: table};
    var array = [];

    var onScan = function (err, data) {
        if (err) {
            console.error("Unable to scan the table");
        } else {
            console.log("Scan succeeded");
            data.Items.forEach(function (order) {
                var obj = {
                    "orderID": order["orderID"],
                    "Feedback": order["Feedback"]
                };

                for (var i = 0; i < food.length; i++) {
                    if (order.hasOwnProperty(food[i])) {
                        obj[food[i]] = order[food[i]];
                    } else {
                        obj[food[i]] = " ";
                    }
                }

                array.push(obj);
            });

            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                ddb_doc.scan(params, onScan);
            } else {
                res.render('SearchFeedback', {
                    orders: array
                });
            }
        }
    };

    ddb_doc.scan(params, onScan);
};

app.use(function (req, res, next) {
        if (req.url === '/admin.html' || req.url === '/SearchInventory.html') {
            console.log("private request: " + req.url);

            if (req.session && req.session.authenticated) {
                res.sendFile(__dirname + '/private' + req.url);
            } else {
                res.sendStatus(404);
            }
        } else if (req.url === '/SearchFeedback.html') {
            console.log("private request: SearchFeedback.html");

            if (req.session && req.session.authenticated) {
                sendSearchFeedback(res);
            } else {
                res.sendStatus(404);
            }
        } else {
            console.log("public request: " + req.url);
            next();
        }

        console.log(req.body);
    }
);

app.get('/', function (req, res) {
    res.redirect('/index.html');
});

app.get('/login', function (req, res) {
    if (req.session && req.session.authenticated) {
        res.redirect('/admin.html');
    } else {
        res.redirect('/Adminlogin.html');
    }
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
        res.redirect('/loginfail.html');
    }
});

app.post('/feedback', function (req, res) {
    console.log('POST SUCCESS');
    console.log(req.body);

    var params = {
        TableName: table,
        Key: {
            "orderID": req.body["orderNumber"]
        },
        UpdateExpression: 'set #a = :x',
        ConditionExpression: 'attribute_exists(#a) AND #a = :y',
        ExpressionAttributeNames: {'#a': 'Feedback'},
        ExpressionAttributeValues: {
            ':x': req.body["feedbackText"],
            ':y': 'N/A'
        },
        ReturnValues: "UPDATED_NEW"
    };

    ddb_doc.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item");
            res.redirect('/index.html');
        } else {
            console.log("UpdateItem succeeded");
            res.redirect('/Feedback.html');
        }
    });
});

app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});
