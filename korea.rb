#encoding: utf-8
require 'json'
require 'net/http'
require 'nokogiri'
require 'faye'
require 'eventmachine'
require 'mechanize'
require 'date'

@is_first = true
@replacements = [
  [ "KRW" , ""],
  [ "BTC" , ""],
  [ ",", ""],
  [ " " , ""]
  ]
@PRICE_MAX_LENGTH = 7

def bitstamp_price
  json = JSON.parse(parse_https('https://www.bitstamp.net/api/ticker/'))
  json['last']
end

@LAST_OKCOIN = 0
def okcoin_future_price
  json = JSON.parse(parse_https('https://www.okcoin.com/api/v1/future_ticker.do?symbol=btc_usd&contract_type=this_week'))
  ret = json['ticker']['last']
  @LAST_OKCOIN = ret if ret != nil
  return @LAST_OKCOIN
end

def broadcast(channel, text)
  message = {:channel => channel, :data => text}
  uri = URI.parse('http://j96.me:8888/faye')
  #uri = URI.parse('http://localhost:8888/faye')
  Net::HTTP.post_form(uri, :message => message.to_json)
end

def parse_http(url_string)
  url = URI.parse(url_string)
  response = Net::HTTP.start(url.host) do |http|
    http.get url.request_uri, 'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71'
  end
  case response
  when Net::HTTPRedirection
  when Net::HTTPSuccess
    response.body
  else
    ""
  end
end

def parse_https(url_string)
  url = URI.parse(url_string)
  response = Net::HTTP.start(url.host, use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_NONE) do |http|
    http.get url.request_uri, 'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71'
  end
  case response
  when Net::HTTPRedirection
  when Net::HTTPSuccess
    response.body
  else
    ""
  end
end

def show_price price
  space = @PRICE_MAX_LENGTH - price.length

  new_price = ""
  space.times { |value| new_price << " " }
  new_price + price
end

def xcoin
  begin
    json = JSON.parse(parse_https('https://api.xcoin.co.kr/public/recent_transactions'))
    json_array = json["data"]
    json_array.each do |item|
      time = DateTime.strptime(item["transaction_date"]+" +0900", "%Y-%m-%d %H:%M:%S %z").to_time.to_i
      last_price = item["price"]
      last_qty = item["units_traded"]

      @replacements.each do |pair|
        last_price.gsub!(pair[0], pair[1])
        last_qty.gsub!(pair[0], pair[1])
      end

      currentTime = last_price+last_qty+time.to_s
      if currentTime == @xcoin_realFirstValue
        break
      end

      bitstamp = bitstamp_price
      okcoin = okcoin_future_price

      if @is_first == false
        text = "%s\t%s(%s)\t%.2f\t%s\n" % [Time.at(time).strftime(%"%H:%M"), show_price(last_price), bitstamp.to_s, last_qty, "xcoin"]
        puts text;

        broadcast("/trade", {'trade' => {'time' => time, 'price' => last_price, 'okcoin' => okcoin, 'bitstamp' => bitstamp, 'last_qty' => last_qty, 'site' => 'xcoin'}})

        read_price(last_price, '엑스꼬인')
      end

      if json_array.first == item
        @xcoin_firstValue = currentTime;
      end
    end
    @xcoin_realFirstValue = @xcoin_firstValue;
  rescue Exception => exception
    #puts "#{exception.message}\n#{exception.backtrace.join("\n")}"
  end
end

def coinone
  begin
    #https://api.coinone.co.kr/trades/?format=json&time=hour?format=json&time=hour
    #http://api.coinone.co.kr/transactions/?format=json&time=hour
    json = JSON.parse(parse_https('https://api.coinone.co.kr/trades/?format=json&time=hour?format=json&time=hour'))
    json_array = json["completeOrders"]
    json_array = json_array.sort_by { |hash| hash['timestamp'].to_i }.reverse
    json_array.each do |item|
      time = item["timestamp"].to_i;
      last_price = item["price"]
      last_qty = item["qty"]

      currentTime = last_price+last_qty+time.to_s
      if currentTime == @coinone_realFirstValue
        break
      end

      bitstamp = bitstamp_price
      okcoin = okcoin_future_price


      if @is_first == false
        text = "%s\t%s(%s)\t%.2f\t%s\n" % [Time.at(time).strftime(%"%H:%M"), show_price(last_price), bitstamp.to_s, last_qty, "coinone"]
        puts text;

        broadcast("/trade", {'trade' => {'time' => time, 'price' => last_price, 'okcoin' => okcoin, 'bitstamp' => bitstamp, 'last_qty' => last_qty, 'site' => 'coinone'}})
      end
      read_price(last_price, '꼬인원')

      if json_array.first == item
        @coinone_firstValue = currentTime;
      end

    end
    @coinone_realFirstValue = @coinone_firstValue;
  rescue Exception => exception
    #puts "#{exception.message}\n#{exception.backtrace.join("\n")}"
  end

end

def korbit
  begin
    json_array = JSON.parse(parse_https('https://api.korbit.co.kr/v1/transactions'))
    json_array.each do |item|

      time = item["timestamp"].to_i / 1000;
      last_price = item["price"]
      last_qty = item["amount"]

      @replacements.each do |pair|
        last_price.gsub!(pair[0], pair[1])
        last_qty.gsub!(pair[0], pair[1])
      end

      currentTime = last_price+last_qty+time.to_s
      if currentTime == @korbit_realFirstValue
        break
      end

      bitstamp = bitstamp_price
      okcoin = okcoin_future_price

      if @is_first == false
        text = "%s\t%s(%s)\t%.2f\t%s\n" % [Time.at(time).strftime(%"%H:%M"), show_price(last_price), bitstamp.to_s, last_qty, "korbit"]
        puts text;

        broadcast("/trade", {'trade' => {'time' => time, 'price' => last_price, 'okcoin' => okcoin, 'bitstamp' => bitstamp, 'last_qty' => last_qty, 'site' => 'korbit'}})
      end
      read_price(last_price, '꼬빗')

      if json_array.first == item
        @korbit_firstValue = currentTime;
      end
    end
    @korbit_realFirstValue = @korbit_firstValue;

  rescue Exception => exception
    #puts "#{exception.message}\n#{exception.backtrace.join("\n")}"
  end
end


def read_price(price, site)
=begin
    system("say -v Yuna '" + site + " 최저까 갱신 : " + price + "원'") if @last_saved_low_price != nil && @last_saved_low_price > price.to_i
    system("say -v Yuna '" + site + " 최고까 갱신 : " + price + "원'") if @last_saved_high_price != nil && @last_saved_high_price < price.to_i

    if @last_bitstamp_price != nil && @last_saved_low_price > price.to_i && @last_saved_high_price < price.to_i
      if @last_bitstamp_price > bitstamp_price
        system("say -v Yuna '비뜨스템프 " + (@last_bitstamp_price - bitstamp_price).to_s + " 달러 떨어짐'");
      elsif @last_bitstamp_price < bitstamp_price
        system("say -v Yuna '비뜨스템프 " + (bitstamp_price - @last_bitstamp_price).to_s + " 달러 오름'");
      end
    end

  @last_saved_low_price = price.to_i if @last_saved_low_price == nil
  @last_saved_high_price = price.to_i if @last_saved_high_price == nil

  @last_saved_low_price = [price.to_i, @last_saved_low_price].min
  @last_saved_high_price = [price.to_i, @last_saved_high_price].max

  @last_bitstamp_price = bitstamp_price
=end
end


printf "시간\t" + "BTC" + "\t\t수량\t사이트\n"
running = true
Kernel.trap("INT") { running = false }
begin
  while(true)
    begin
      xcoin
      korbit
      coinone
      @is_first = false
      sleep(1)
    rescue Exception => exception
      puts exception
    end
  end
end
