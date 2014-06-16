var REDIS_ADDR = '127.0.0.1',
    REDIS_KEY = 'faye_korea',
    REDIS_LIST_SIZE = 50;

var faye = require('./server.js'),
    redis_server = require("redis"),
    jsonify = require('redis-jsonify'),
    redis = jsonify(redis_server.createClient(6379, REDIS_ADDR, null));

var http = require('http');

var server = http.createServer(function(request, http_response) {
  redis.lrange([REDIS_KEY, 0, REDIS_LIST_SIZE-1], function(err, response){
    http_response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    http_response.end(JSON.stringify(response));
  });
});


//server start
faye.start(server, function(clientId, channel, data) {
  //console.log('channel : ' + channel + ', data : ' + JSON.stringify(data));
  
  //store publish data
  redis.rpush(REDIS_KEY, data.trade, function(err, response) {
    if(err)
      console.log('[' + new Date() + '][RedisErr] ' + err);
    else
      redis.llen([REDIS_KEY], function(err, response) {
        if(err)
          console.log('[' + new Date() + '][RedisErr] ' + err);
        else if(response > REDIS_LIST_SIZE)
          redis.lpop([REDIS_KEY], function(err, response){});
      });
  });
});

//Error catch
process.on('uncaughtException', function (err) {
  console.log('[' + new Date() + '][Error] ' + err.stack);
}); 