//jjangg96
//simple faye server for node.js

var http = require('http'),
    faye = require('faye'),
    port = 8000;

var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

// Handle non-Bayeux requests
var server = http.createServer(function(request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Hello, non-Bayeux request');
});


exports.start = function start(custom_server, publish_callback)
{
  if(custom_server == null)
  {
    bayeux.attach(server);
    server.listen(port);
  }
  else
  {
    bayeux.attach(custom_server);
    custom_server.listen(port);
  }
  
  console.log('faye server started, port ' + port);

  if(publish_callback != null)
  {
    bayeux.on('publish', publish_callback);
  }
  
}


//Error catch
process.on('uncaughtException', function (err) {
  console.log('[' + new Date() + '][Error] ' + err.stack);
}); 