var oldest_timestamp;
var lastest_timestamp;
var olhc_list = [];
var graph_type = 60 * 15; // second

getOLHC(0, function() { set_size(document.body.clientWidth, document.body.clientHeight/4); init(); });

function add_to_olhc(json) {
  //{"t":1403252441,"p":585,"v":4};
  var key = Math.floor(json.t / graph_type) * graph_type;

  var last = _.last(olhc_list);
  if(last != null && last.t == key)
  {
    var p = json.p;
    last.c = p;
    last.h = (last.h<p?p:last.h);
    last.l = (last.l>p?p:last.l);
    last.v += json.v;
  }
  else
  {
    var new_json = {'t': key, 'o':json.p,'l':json.p, 'h':json.p, 'c':json.p, 'v':json.v};
    olhc_list.push(new_json);
  }
}

function updateOldestTimestamp(oldest) {
  if(oldest_timestamp == null || oldest_timestamp > oldest)
    oldest_timestamp = oldest;
}
function updateLastestTimestamp(latest) {
  if(lastest_timestamp == null || lastest_timestamp < latest)
    lastest_timestamp = latest;
}

function getOldOLHC(count, callback) {
  callback();
}


function getOLHC(count, callback) {
  $.ajax({
    type:'GET',
    url:'http://j96.me:8888/chart',
    success:function(json){
      json = _.sortBy(json, function(item) { return item.time });
      _.each(json, function(item) {
        add_to_olhc({'t': parseInt(item.time), 'p': parseFloat(item.price), 'v': parseFloat(item.last_qty) });
      });
      refresh(0);
      callback();
    },
    error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
  });
}
