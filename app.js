var http = require('http');
var fs = require('fs');
var url = require('url');
var port = process.env.PORT || 9119;

http.createServer(function (req, res) {
    console.log(req.url);
    var doc = url.parse(req.url, true);
    var filename = "." + doc.pathname;

    fs.readFile(filename, function (err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end("404 Not Found");
            return;
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
}).listen(port, function () {
    console.log('Server running at  http://localhost:' + port + '/index.html');
});
