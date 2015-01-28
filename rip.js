'use strict';

/*jshint node:true */

var fs = require('fs');
var request = require('superagent');
var htmlparser = require('htmlparser');
var jsonQuery = require('json-query');
var traverse = require('./traverse');



var html2json = function(htmlString, cb) {
	var handler = new htmlparser.DefaultHandler(cb);
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(htmlString);
};



/*var filteredStringify = function(o) {
	return JSON.stringify(o, function(k, v) {
		//return ( (k === 'raw' || k === 'data') ? undefined : v);
		return ( (k === 'raw') ? undefined : v);
	});
};

var filteredObject = function(o) {
	return JSON.parse( filteredStringify(o) );
};*/



var DOMAIN = 'http://www.ukara.net';

/*
	1) SEARCH SONGS

	curl 'http://www.ukara.net/ajax.searchsongs.jsp'
	-H 'Cookie: JSESSIONID=bab0oLpjt1tN88xAJYriDg; __utma=216728978.1914727188.1422396574.1422396574.1422396574.1; __utmb=216728978.10.10.1422396574; __utmc=216728978; __utmz=216728978.1422396574.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)'
	-H 'Origin: http://www.ukara.net'
	-H 'Accept-Encoding: gzip, deflate'
	-H 'Accept-Language: en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2'
	-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36'
	-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'
	-H 'Accept: * /*'
	-H 'Referer: http://www.ukara.net/karaoke-online'
	-H 'X-Requested-With: XMLHttpRequest'
	-H 'Connection: keep-alive'
	--data 'query=master&cursor=&type=search&language=en' --compressed
*/
var querySong = function(term, cb) {
	request
		.post('http://www.ukara.net/ajax.searchsongs.jsp')

		.send({query:term, cursor:'', type:'search', language:'en'})
		
		.set('Cookie', 'JSESSIONID=bab0oLpjt1tN88xAJYriDg; __utma=216728978.1914727188.1422396574.1422396574.1422396574.1; __utmb=216728978.10.10.1422396574; __utmc=216728978; __utmz=216728978.1422396574.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)')
		.set('Origin', 'http://www.ukara.net')
		.set('Accept-Language', 'en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2')
		.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36')
		.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
		.set('Accept', '*/*')
		.set('Referer', 'http://www.ukara.net/karaoke-online')
		.set('X-Requested-With', 'XMLHttpRequest')
		//.set('Connection', 'keep-alive')

		.end(function(err, resp) {
			if (err) { return cb(err); }

			//console.log(resp.statusCode, resp.text);

			html2json(resp.text, function(err, root) {
				if (err) { return cb(err); }
			
				var item = {}, items = [];
				try {
					var log = false;
					var process = function() {
						if (Object.keys(item).length === 3) {
							items.push(item);
							item = {};
						}
					};

					traverse(root, function(data) {
						var v;
						if (data.kind === 'string' && data.value === "a class=\"pink\" href=\"#\"") {
							v = data.parent.value.children[0].data;
							item.title = v; process();
						 	if (log) { console.log('title:   ', v); }
						}
						if (data.kind === 'string' && data.value === "a href=\"#\"") {
							v = data.parent.value.children[0].data;
							item.artist = v; process();
							if (log) { console.log('artist:  ', v); }
						}
						if (data.kind === 'string' && data.arg === 'data-songUrl') {
							v = data.value;
							item.url = DOMAIN + v; process();
							if (log) { console.log('song url:', v, '\n'); }
						}
					});
				} catch (ex) {
					return cb(ex);
				}

				cb(null, items);	
			});
		});
};



/*querySong('crazy in love', function(err, items) { // songName...
	if (err) { throw err; }

	items.forEach(function(it) {
		console.log(['* ', it.artist, ' - ', it.title, ' -> ', it.url].join(''));
	});
});*/



/*
	FETCH SONG METADATA
*/

/*
	FETCH SONG LYRICS
*/

/*
	FETCH SONG MP3
*/

