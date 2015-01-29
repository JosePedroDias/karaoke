'use strict';

/*jshint node:true */

var fs = require('fs');
var request = require('superagent');
var htmlparser = require('htmlparser');
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
		
		//.set('Cookie', 'JSESSIONID=bab0oLpjt1tN88xAJYriDg; __utma=216728978.1914727188.1422396574.1422396574.1422396574.1; __utmb=216728978.10.10.1422396574; __utmc=216728978; __utmz=216728978.1422396574.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)')
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
	2) PROCESS SONG PAGE
*/
var getSongPageData = function(songUrl, cb) {
	request
		.get(songUrl)
		
		//.set('Cookie', 'JSESSIONID=bab0oLpjt1tN88xAJYriDg; __utma=216728978.1914727188.1422396574.1422396574.1422396574.1; __utmb=216728978.10.10.1422396574; __utmc=216728978; __utmz=216728978.1422396574.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)')
		.set('Origin', 'http://www.ukara.net')
		.set('Accept-Language', 'en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2')
		.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36')
		//.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
		.set('Accept', '*/*')
		//.set('Referer', 'http://www.ukara.net/karaoke-online')
		//.set('X-Requested-With', 'XMLHttpRequest')

		.end(function(err, resp) {
			if (err) { return cb(err); }

			//console.log(resp.statusCode, resp.text);

			//fs.writeFileSync('a.html', resp.text);

			try {
				cb(null, {
					songId: songUrl.split('-').pop(),
					password: ( /encodeURIComponent\('([^']+)'\)/ ).exec( resp.text )[1]
				});
			} catch (ex) {
				cb(ex);
			}
		});
};

/*getSongPageData('http://www.ukara.net/karaoke/enter-sandman-30016810', function(err, res) {
	console.log(err, res);
});*/

/* RESULT:
{ songId: '30016810',
  password: 'KR286mBARlEYm/5WK7ewf6476o7+Tr+fIZVFv6AuF7dGV/CK2CSq1VxR7RpitKjA' }
*/



/*
	3) FETCH SONG METADATA

	curl 'http://www.ikara.co/web.GetSong'
	-H 'Origin: http://www.ukara.net'
	-H 'Accept-Encoding: gzip, deflate'
	-H 'Accept-Language: en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2'
	-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36'
	-H 'Content-Type: application/x-www-form-urlencoded'
	-H 'Accept: * / *'
	-H 'Referer: http://www.ukara.net/karaoke/Main.swf'
	-H 'X-Requested-With: ShockwaveFlash/16.0.0.296'
	-H 'Connection: keep-alive'
	--data 'parameters=%7B%22songId%22%3A%2220014609%22%2C%22password%22%3A%22KR286mBARlEYm%2F5WK7ewfzfX2Zgbaj1lgrkoyRwubT3oK9GkLq0lakUbAN7jys2D%22%2C%22userId%22%3A%22null%22%7D'
*/
var getSongMetadata = function(songParams, cb) {
	request
		.post('http://www.ikara.co/web.GetSong')

		.send('parameters=' + encodeURIComponent(JSON.stringify({songId:songParams.songId, password:songParams.password, userId:'null'})) )

		.set('Origin', 'http://www.ukara.net')
		.set('Accept-Language', 'en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2')
		.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36')
		.set('Content-Type', 'application/x-www-form-urlencoded')
		.set('Accept', '*/*')
		.set('Referer', 'http://www.ukara.net/karaoke/Main.swf')
		.set('X-Requested-With', 'ShockwaveFlash/16.0.0.296')
		//.set('Connection', 'keep-alive')

		.end(function(err, resp) {
			if (err) { return cb(err); }

			//console.log(resp.statusCode, resp.text);

			//fs.writeFileSync('a.json', resp.text);

			try {
				var o = JSON.parse(resp.text);
				o = o.song;

				cb(null, {
					title:     o.songName,
					artist:    o.singerName,
					lyricsKey: o.approvedLyric,
					mp3URL:    o.songUrl
				});
			} catch (ex) {
				cb(ex);
			}
		});
};

/*getSongMetadata({songId:'30016810', password:'KR286mBARlEYm/5WK7ewf6476o7+Tr+fIZVFv6AuF7dGV/CK2CSq1VxR7RpitKjA'}, function(err, md) {
	console.log(err, md);
});*/
/* RESULT:
{ title: 'Enter Sandman',
  artist: 'Metallica',
  lyricsKey: 'aglzfmlrYXJhNG1yDgsSBUx5cmljGJbOqQcM',
  mp3URL: 'http://data2.ikara.co/data3/karaokes/rk/16810.mp3' }
*/



/*
	4) FETCH SONG LYRICS

	curl 'http://www.ikara.co/test/getlyric?lyrickey=aglzfmlrYXJhNG1yDgsSBUx5cmljGJ6h4AYM'
	-H 'Accept-Encoding: gzip, deflate, sdch'
	-H 'Accept-Language: en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2'
	-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36'
	-H 'Accept: * / *'
	-H 'Referer: http://www.ukara.net/karaoke/don%27t-stop-believing-%28small-town-girl%29-20014609'
	-H 'X-Requested-With: ShockwaveFlash/16.0.0.296'
	-H 'Connection: keep-alive' --compressed
*/

var simplifyFormat = function(body) {
	return body.lines.map(function(l) {
		return l.words.map(function(w) {
			return [w.startTime, w.text];
		});
	});
};

var getSongLyrics = function(lyricsKey, cb) {
	request
		.get('http://www.ikara.co/test/getlyric?lyrickey=' + lyricsKey)

		.set('Origin', 'http://www.ukara.net')
		.set('Accept-Language', 'en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2')
		.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36')
		.set('Accept', '*/*')
		.set('Referer', 'http://www.ukara.net/karaoke/Main.swf')
		.set('X-Requested-With', 'ShockwaveFlash/16.0.0.296')
		//.set('Connection', 'keep-alive')

		.end(function(err, resp) {
			if (err) { return cb(err); }

			//console.log(resp.statusCode, resp.text);

			//fs.writeFileSync('a.json', resp.text);

			try {
				var o = JSON.parse(resp.text);

				o = simplifyFormat(o);

				cb(null, o);
			} catch (ex) {
				cb(ex);
			}
		});
};

/*getSongLyrics('aglzfmlrYXJhNG1yDgsSBUx5cmljGJbOqQcM', function(err, lines) {
	console.log(err, lines);
});*/
/* RESULT:
null, [ [ [ 71.166, ' ♪' ],
    [ 71.666, ' ♪' ],
    [ 72.166, ' ♪' ],
    [ 72.666, ' ♪' ],
    [ 73.166, ' ♪' ] ],
  [ [ 73.666, 'Say ' ], [ 73.875, 'your ' ], [ 74, 'prayers' ] ],
  [ [ 74.625, 'little ' ], [ 74.916, 'one' ] ],
  [ [ 75.541, 'Don\'t ' ],
    [ 75.75, 'forget, ' ],
    [ 76.208, 'my ' ],
    [ 76.625, 'son' ] ],
	...
*/



/*
	5) FETCH SONG MP3
*/
var getSongMp3 = function(url, destinationDir, cb) {
	request
		.get(url)

		.set('Origin', 'http://www.ukara.net')
		.set('Accept-Language', 'en-US,en;q=0.8,pt-PT;q=0.6,pt;q=0.4,es;q=0.2,fr;q=0.2,nb;q=0.2')
		.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36')
		.set('Accept', '*/*')
		.set('Referer', 'http://www.ukara.net/karaoke/Main.swf')
		.set('X-Requested-With', 'ShockwaveFlash/16.0.0.296')
		//.set('Connection', 'keep-alive')

		.end(function(err, resp) {
			if (err) { return cb(err); }

			// console.log(resp);

			var ws = fs.createWriteStream(destinationDir + '/track.mp3', {encoding:'binary', flags:'w'});

			resp.pipe(ws);

			ws.on('error', function(err) {
				cb(err);
			});

			ws.on('finish', function() {
				ws.close(cb);
			});
		});
};

var getSongMp32 = function(url, destinationDir, cb) {
	console.log( ['wget ', url, ' -O ', destinationDir, '/track.mp3'].join('') );
	cb(null);
};

// var dir = 'songs/Metallica-Enter_Sandman';
//fs.mkdirSync(dir);
/*getSongMp3('http://data2.ikara.co/data3/karaokes/rk/16810.mp3', dir, function(err) {
	console.log(err || 'OK!');
});*/



var fetchSong = function(songUrl, cb) {
	getSongPageData(songUrl, function(err, songPageData) {
		if (err) { return cb(err); }

		console.log('\nsongPageData\n', songPageData);
		/*{ songId: '30016810',
		    password: 'KR286mBARlEYm/5WK7ewf6476o7+Tr+fIZVFv6AuF7dGV/CK2CSq1VxR7RpitKjA' }*/

		getSongMetadata({songId:songPageData.songId, password:songPageData.password}, function(err, metadata) {
			if (err) { return cb(err); }

			console.log('\nmetadata\n', metadata);
			/*{ title: 'Enter Sandman',
			    artist: 'Metallica',
			    lyricsKey: 'aglzfmlrYXJhNG1yDgsSBUx5cmljGJbOqQcM',
			    mp3URL: 'http://data2.ikara.co/data3/karaokes/rk/16810.mp3' }*/

			var dir = ['songs/', metadata.artist, '-', metadata.title].join('').replace(/[ \t]/g, '_');

			try {
				fs.mkdirSync(dir);
			} catch(ex) {}

			fs.writeFile(dir + '/metadata.json', JSON.stringify(metadata), function(err) {
				if (err) { return cb(err); }

				getSongLyrics(metadata.lyricsKey, function(err, lyrics) {
					if (err) { return cb(err); }

					console.log('\nlyrics\n', lyrics);
					/*[[[23.1, 'asd'], [25,'xcv']], [[...]]]*/

					fs.writeFile(dir + '/lyrics.json', JSON.stringify(lyrics), function(err) {
						if (err) { return cb(err); }

						getSongMp32(metadata.mp3URL, dir, function(err) {
							if (err) { return cb(err); }

							cb(null, {
								songPageData: songPageData,
								metadata:     metadata,
								lyrics:       lyrics,
								dir:          dir
							});
						});
					});
				});
			});
		});
	});
};

/*fetchSong('http://www.ukara.net/karaoke/master-of-puppets-20028487', function(err, stuff) {
	console.log(err);//, stuff);
});
*/



module.exports = {
	querySong: querySong,
	fetchSong: fetchSong
};
