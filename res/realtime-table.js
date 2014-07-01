var max_price = 0;
var min_price = 99999999;

var bitstamp_max_price = 0;
var bitstamp_min_price = 99999999;
$(function() {
  
  $('#info-btn').popover();

  
  addToHomescreen({
    startDelay: 60,
    skipFirstVisit: true,
    maxDisplayCount: 1,
    lifespan: 0,
    icon: false
  });
  
  $.getJSON('http://j96.me:8888',function(json) {

    var history = json.history
    history = _.sortBy(history, function(item) { return item.time });

    for(i in history)
      addRow(history[i], false);  

    $('#min_max tbody tr:last').append('<td id="min">' + json['min'] + '</td><td id="max">' + json['max'] + '</td>');

  });

  var client = new Faye.Client('http://j96.me:8888/faye');
  client.subscribe('/trade', function(json){ 
    addRow(json.trade, true); 
    add_to_olhc({'t': parseInt(json.trade.time), 'p': parseFloat(json.trade.price), 'v': parseFloat(json.trade.last_qty) });
    refresh(0);
  });
  client.subscribe('/min', function(json){ $('#min').text(json.price); });
  client.subscribe('/max', function(json){ $('#max').text(json.price); });
});

function addRow(json, can_flash) {
  $('#history tbody').prepend(makeRow(json));  
  if(can_flash)
    flash($('#history tbody tr:first'), 'green');

  document.title = numeral(json.price).format('0,0') + '(' + json.bitstamp + ')';


  $('meta[name=description]').remove();
  $('meta[property="og:description"]').remove();
  $('head').append('<meta name="description" content="최근 국내에서 거래된 비트코인 가격과 실시간 차트를 볼 수 있습니다. 최종가격 : ' + numeral(json.price).format('0,0') + '(' + json.site.toUpperCase() + '), Bitstamp : ' + json.bitstamp + '" >');
  $('head').append('<meta property="og:description" content="최근 국내에서 거래된 비트코인 가격과 실시간 차트를 볼 수 있습니다. 최종가격 : ' + numeral(json.price).format('0,0') + '(' + json.site.toUpperCase() + '), Bitstamp : ' + json.bitstamp + '" >');

}

function makeRow(json) {
  var is_max = false;
  var is_min = false;
  var is_large_amount = false;

  var is_bitstamp_max = false;
  var is_bitstamp_min = false;

  if(max_price < parseInt(json.price))
  {
    is_max = true;
    max_price = parseInt(json.price);
  }

  if(min_price > parseInt(json.price))
  {
    is_min = true;
    min_price = parseInt(json.price);
  }

  if(parseInt(json.last_qty) >= 10)
    is_large_amount = true;

  if(bitstamp_max_price < parseFloat(json.bitstamp))
  {
    is_bitstamp_max = true;
    bitstamp_max_price = parseFloat(json.bitstamp);
  }

  if(bitstamp_min_price > parseFloat(json.bitstamp))
  {
    is_bitstamp_min = true;
    bitstamp_min_price = parseFloat(json.bitstamp);
  }

  return '<tr id="' + json.site + '"><td id="time">' + moment.unix(json.time).format('HH:mm') + '</td>' +
    '<td id="price" class="' + (is_max?'max':(is_min?'min':'')) + '">' + numeral(json.price).format('0,0') + ' <abbr title="' + json.site.toUpperCase() + '">(' + json.site.slice(0,1).toUpperCase() + ')</abbr>' + (is_max?'↑':(is_min?'↓':'')) + '</td>' +
    '<td id="bitstamp" class="' + (is_bitstamp_max?'max':(is_bitstamp_min?'min':'')) + '">' + depth_style(json.bitstamp, 2) + ' ' + (is_bitstamp_max?'↑':(is_bitstamp_min?'↓':'')) + '</td>' +
    '<td id="volume" class="' + (is_large_amount?'large_amount':'') + '">' + depth_style(json.last_qty, 2) + '</td>';
}
function log(str) {
  //$('#log').val(str + '\n' + $('#log').val());
};

zero = ["", "0", "00", "000", "0000"];
function depth_style(num, digit) {
  var d = parseFloat(num).toFixed(digit);
  for (var n = d.length, i = 1; i < digit;)
    if (d.charAt(n - i) == "0")
      i++;
    else {
      if (i == 1)
        return d;
      break
    }
  return d.slice(0, n - i + 1) + '<span class="zero">' + zero[i - 1] + "</span>"
}

function flash(element, type) {
  if (type == '')
    return;
  $(element).addClass(type);
  setTimeout(function () {
    $(element).removeClass(type);
  }, 1000);

};


