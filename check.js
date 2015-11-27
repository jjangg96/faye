var request = require("request");

function restart() {
  var spawn = require('child_process').spawn;
  spawn('sudo', ['pkill', '-9', '-f', 'korea']);
  var child = spawn('sudo', ['service', 'korea', 'restart']);
}

//Error catch
process.on('uncaughtException', function (err) {
  console.log('[' + new Date() + '][Error] ' + err.stack);
}); 



request({uri: 'http://localhost:8888/timestamp', timeout: 5000 }, function(err, response, body) {
  if(err || response.statusCode != 200) {
    console.log('Server down');
    restart();
  } else if(response.statusCode == 200) {
    if(body != "") {
      var delay = parseInt(body);  

      if(delay > 10*60*1000) {
        restart();
      } else {
        console.log(delay);
      }
    }
  }
});  

