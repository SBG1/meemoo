var express = require('express'),
    http = require('http'),
    compression = require('compression'),
    killable = require('killable');

module.exports = function() {
    try {
        var argv = require('minimist')(process.argv.slice(2));
        console.dir(argv);
        //var TARGET_URL = 'http://localhost:8887/sbg-platform';

        var app = express(),
            liveReloadServer;

        var rootPath = argv._[0] = argv._[0] || '.';

        if (argv.livereload) {
            app.use(require('connect-livereload')({
                port: 35729
            }));

            var livereload = require('livereload');
            liveReloadServer = livereload.createServer();
            liveReloadServer.watch("./" + rootPath);
        }

        // Messes with kill. Need to investigate
        if (argv.compress) app.use(compression());

        app.use(express.static(rootPath));

        // Left here as an example of implementing a reverse proxy
        //app.use(forward(/\/sbg-platform\/(.*)/, TARGET_URL));

        app.get('/kill', function(req, res) {
            res.end();
            server.close();
            if (liveReloadServer) liveReloadServer.config.server.close();
            //server.kill();
            process.exit();
        });

        var server = http.createServer(app);

        function onError(err) {
            if (err.code === 'EADDRINUSE') {
                console.log("Server already running. Stop it by entering http://localhost/kill in your browser");
            }
        }

        server.once('error', onError);

        server.listen(9091);

        killable(server);

    } catch (e) {
        console.log("Error starting server");
    }
};