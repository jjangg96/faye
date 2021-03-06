var oldest_timestamp = 9999999999;
var lastest_timestamp = 0;
var olhc_list = [];
var graph_type_list = [60 * 1, 60 * 5, 60 * 15, 60 * 60, 60 * 60 * 24, 60 * 60 * 24 * 7];
var graph_type_cookie = ($.cookie('graph_type') == undefined)?2:$.cookie('graph_type'); // second
$('a#graph_type').removeClass('enable');
$('a.graph_type_' + graph_type_cookie).toggleClass('enable', true);
var graph_type = graph_type_list[graph_type_cookie]; // second

function change_graph_type(i, obj) {
  oldest_timestamp = 9999999999;
  lastest_timestamp = 0;
  graph_type = graph_type_list[i];
  $.cookie('graph_type', i);


  $('a#graph_type').removeClass('enable');
  $(obj).toggleClass('enable', true);

  getOLHC(0, function () {
    init();
  });
}

getOLHC(0, function() {   
  set_size($("div.container").width(), $(window).height()/3); 
  init(); 
  d3.select(window).on('resize', function() {
    set_size($("div.container").width(), $(window).height()/3); 
    init(); 
  }); 
});
function add_missing_olhc(list, last, json) {
  var expected_timestamp = last.t + graph_type;
  if (json.t != expected_timestamp) {
    for (var j = expected_timestamp; j < json.t; j = j + graph_type) {
      var new_item = { t: j, o: last.c, l: last.c, h: last.c, c: last.c, v: 0, ok: last.ok};
      list.push(new_item);
    }
  }
}

function add_sma_list(list) {
  var value_array = [];
  for(var i=0; i<list.length; i++) {
    value_array.push(list[i].c);
    list[i].sma10 = 0;
    list[i].sma50 = 0;
    list[i].sma100 = 0;

    if(i>10)
      list[i].sma10 = _.reduce(_.last(value_array, 10), function(t, d){ return t + d; }, 0) / 10;
    if(i>50)
      list[i].sma50 = _.reduce(_.last(value_array, 50), function(t, d){ return t + d; }, 0) / 50;
    if(i>100)
      list[i].sma100 = _.reduce(_.last(value_array, 100), function(t, d){ return t + d; }, 0) / 100;
  }
}

function add_to_last(json, last) {
  //{"t":1403252441,"p":585,"v":4};
  var key = Math.floor(json.t / graph_type) * graph_type;

  if(last != null && last.t == key)
  {
    var p = json.p;
    last.c = p;
    last.h = (last.h<p?p:last.h);
    last.l = (last.l>p?p:last.l);
    last.v += json.v;
    last.ok = (last.ok<json.ok?json.ok:last.ok);
    return last;
  }
  else
  {
    var new_json = {'t': key, 'o':json.p,'l':json.p, 'h':json.p, 'c':json.p, 'v':json.v, 'ok':json.ok};
    if(last == null)
      last = new_json;
    
    add_missing_olhc(olhc_list, last, new_json);    
    olhc_list.push(new_json);
    return new_json;
  }
}


function add_new_data(json) {
  add_to_last(json, _.last(olhc_list));
  olhc_list = _.sortBy(olhc_list, function(num){ return num.t; });
  add_sma_list(olhc_list);  
  
  return true;
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
    url:'http://www.btckorea.org:8888/chart',
    success:function(json){
      olhc_list = [];
      var last = _.last(olhc_list);
      _.each(json, function(item) {
        last = add_to_last({'t': parseInt(item.time), 'p': parseFloat(item.price), 'v': parseFloat(item.last_qty), 'ok': (item.okcoin == null?0:parseFloat(item.okcoin))}, last);
      });
      
      olhc_list = _.sortBy(olhc_list, function(num){ return num.t; });
      add_sma_list(olhc_list);
      
      callback();
    },
    error:function(request,status,error){ console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error); }
  });
}
