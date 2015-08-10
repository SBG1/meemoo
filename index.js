var express = require('express'),
    http = require('http'),
    killable = require('killable'),
    minimist = require('minimist');

module.exports = function(params) {
    var argv,
        app = express(),
        liveReloadServer;

    if (params) {
        argv = minimist(params);
    } else {
        argv = minimist(process.argv.slice(2))
    }

    var serverOptions = {
        setLiveReload: function() {
            if (argv.livereload) {
                app.use(require('connect-livereload')({
                    port: 35729
                }));

                try {
                    var livereload = require('livereload');
                    liveReloadServer = livereload.createServer();
                    liveReloadServer.watch("./" + rootPath);
                } catch (e) {

                }
                console.log("LiveReload running");
            }
        },
        setCompression: function() {
            // Messes with kill. Need to investigate
            if (argv.compress) {
                compression = require('compression');
                app.use(compression());
                console.log("Compression enabled");
            }
        },
        setOpenSite: function() {
            if (argv.open) {
                var base = argv.base || '',
                    opener = require("opener");
                setTimeout(function() { // Give mock server and whatever else a chance to start
                    opener("http://localhost:" + port + '/' + base);
                    console.log("Opening site");
                }, 1000);
            }
        }
    };

    try {
        var rootPath = argv._[ 0 ] = argv._[ 0 ] || '.';

        serverOptions.setLiveReload();
        serverOptions.setCompression();

        app.use(express.static(rootPath));

        // Left here as an example of implementing a reverse proxy
        //app.use(forward(/\/sbg-platform\/(.*)/, TARGET_URL));

        var server = http.createServer(app);

        server.once('error', onError);

        var port = argv.port || 9091;
        server.listen(port, function() {
            console.log('Server running: http://localhost:' + port);
            serverOptions.setOpenSite();
        });

        listenForKillRequest(app);

        killable(server);

        return server;

    } catch (e) {
        console.log("Error starting server: " + e.message);
    }

    function listenForKillRequest() {
        app.get('/kill', function(req, res) {
            res.end();
            server.close();
            if (liveReloadServer) {
                liveReloadServer.config.server.close();
            }
            process.exit();
        });
    }

    function onError(err) {
        if (err.code === 'EADDRINUSE') {
            console.log("Server already running. Stop it by entering http://localhost/kill in your browser");
        } else {
            console.log("Error starting server: " + err);
        }
    }
};