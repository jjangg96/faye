var REDIS_ADDR = '127.0.0.1',
    REDIS_KEY = 'faye_korea',
    REDIS_LIST_SIZE = 100;

var faye = require('./server.js'),
    redis_server = require("redis"),
    redis = redis_server.createClient(6379, REDIS_ADDR, null),
    url = require('url');

var max = 0,
    min = 9999999,
    current_day = 0,
    timestamp = 0;


function init() {
  max = 0;
  min = 9999999;
}

function update_min_max(json) {
  var now = new Date();
  timestamp = now.getTime();

  if(now.getDay() != current_day)
  {
    current_day = now.getDay();
    init();
  }

  var price = parseInt(json.trade.price);
  if(max < price) {
    max = price;
    notice('/max' , price);
  }

  if(min > price) {
    min = price;
    notice('/min' , price);
  }

}

function notice(type, price) {
  faye.client.publish(type, { 'price' : price });
}

var http = require('http');
var server = http.createServer(function(request, http_response) {
  
  var path = url.parse(request.url).path;
  
  if(path == '/chart')
  {
    redis.sort([REDIS_KEY, 'limit', 0, REDIS_LIST_SIZE*100-1, 'ALPHA', 'DESC'], function(err, response){
    //redis.lrange([REDIS_KEY, 0, REDIS_LIST_SIZE*100-1], function(err, response){
      http_response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
      http_response.end(JSON.stringify(JSON.parse('[' + response.reverse() + ']')));
    });
  }
  else if(path == '/')
  {
    redis.sort([REDIS_KEY, 'limit', 0, REDIS_LIST_SIZE, 'ALPHA', 'DESC'], function(err, response){
    //redis.lrange([REDIS_KEY, -REDIS_LIST_SIZE, -1], function(err, response){
      http_response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
      var json = {'history' : JSON.parse('[' + response.reverse() + ']'), 'max' : max, 'min' : min};
      http_response.end(JSON.stringify(json));
    });
  }
  else
  {
    http_response.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin':'*'});
    http_response.end("" + (new Date().getTime() - timestamp));
  }
});


//server start
faye.start(server, function(clientId, channel, data) {
  console.log('channel : ' + channel + ', data : ' + JSON.stringify(data));

  if(channel == '/trade') {
    //store publish data
    if(data.trade.price >= min/2 && data.trade.price > 0)
      redis.rpush(REDIS_KEY, JSON.stringify(data.trade), function(err, response) {
      if(err)
        console.log('[' + new Date() + '][RedisErr] ' + err);
      /*
      if(err)
        console.log('[' + new Date() + '][RedisErr] ' + err);
      else
        redis.llen([REDIS_KEY], function(err, response) {
          if(err)
            console.log('[' + new Date() + '][RedisErr] ' + err);
          else if(response > REDIS_LIST_SIZE)
            redis.lpop([REDIS_KEY], function(err, response){});
        });
      */
    });

    update_min_max(data);
  }
});

//Error catch
process.on('uncaughtException', function (err) {
  console.log('[' + new Date() + '][Error] ' + err.stack);
}); 
