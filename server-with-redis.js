var REDIS_ADDR = '127.0.0.1',
    REDIS_KEY = 'faye_korea',
    REDIS_LIST_SIZE = 100;

var faye = require('./server.js'),
    redis_server = require("redis"),
    redis = redis_server.createClient(6379, REDIS_ADDR, null);

var max = 0,
    min = 9999999,
    current_day = 0;


function init() {
  max = 0;
  min = 9999999;
}

function update_min_max(json) {
  var now = new Date();
  var timestamp = now.getTime();

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
  redis.lrange([REDIS_KEY, 0, REDIS_LIST_SIZE-1], function(err, response){
    http_response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
    var json = {'history' : JSON.parse('[' + response + ']'), 'max' : max, 'min' : min};
    http_response.end(JSON.stringify(json));
  });
});


//server start
faye.start(server, function(clientId, channel, data) {
  console.log('channel : ' + channel + ', data : ' + JSON.stringify(data));

  if(channel == '/trade') {
    //store publish data
    redis.rpush(REDIS_KEY, JSON.stringify(data.trade), function(err, response) {
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

    update_min_max(data);
  }
});

//Error catch
process.on('uncaughtException', function (err) {
  console.log('[' + new Date() + '][Error] ' + err.stack);
}); 