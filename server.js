var http      = require('http'),
    faye      = require('faye'),
    fayeRedis = require('faye-redis');

// Configuration options.
var options = {
    logging: process.env.FAYE_LOGGING || 0,
    redisHost: process.env.FAYE_REDIS_HOST || 'redis',
    redisPort: process.env.FAYE_REDIS_PORT ||  6379,
    listenPort: process.env.FAYE_PORT || 4242,
    mount: process.env.FAYE_MOUNT ||  '/stream',
    timeout: process.env.FAYE_TIMEOUT ||  45,
    sameOriginURL: process.env.FAYE_SAME_ORIGIN_URL || '',
    pushToken: process.env.FAYE_PUSH_TOKEN || ''
};

// We are only concerned with creating push servers, so this is required.
if (options.pushToken.length === 0) {
    console.log('You must supply FAYE_PUSH_TOKEN, pick something strong!');
    process.exit(1);
}

// Adapter configuration.
var bayeux = new faye.NodeAdapter({
    mount: options.mount,
    timeout: options.timeout,
    engine: {
        type: fayeRedis,
        host: options.redisHost,
        port: options.redisPort
    }
});

// Log connection information.
if (options.logging === 1) {
    bayeux.on('handshake', function(clientId) {
        console.log('[' + new Date() + '] Client ID connected: ' + clientId);
    });

    bayeux.on('disconnect', function(clientId) {
        console.log('[' + new Date() + '] Client ID disconnected: ' + clientId);
    });
}

// Catch all non-faye traffic.
var server = http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Up Up Down Down Left Right Left Right B A\n');
});

// Extra pre-cautions just to ensure the push originated from our domain.
var sameOrigin = {
    incoming: function(message, request, callback) {
        if (request && request.headers['host'] !== options.sameOriginURL) {
            message.error = '403::Forbidden origin';
        }

      callback(message);
    }
};

// Since this token is a secret, we are essentially making a push only server
// because without this token you cannot push data to the server.
var ensureAuthToPush = {
    incoming: function(message, callback) {
        if (!message.channel.match(/^\/meta\//)) {
          var pushToken = message.ext && message.ext.pushToken;

          if (pushToken !== options.pushToken) {
              message.error = '403::Forbidden auth token';
          }
        }

      callback(message);
    },
    outgoing: function(message, callback) {
        // Avoid leaking the token to any clients.
        if (message.ext) delete message.ext.pushToken;

        callback(message);
    }
};

// Add our extensions and start the server.
if (options.sameOriginURL.length > 0) {
    bayeux.addExtension(sameOrigin);
}

bayeux.addExtension(ensureAuthToPush);

// Attach and start listening.
bayeux.attach(server);

console.log('Listening on port ' + options.listenPort);
server.listen(options.listenPort);
