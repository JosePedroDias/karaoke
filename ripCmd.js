var rip = require('./rip');



var args = process.argv.slice(2);
var verb = args.shift();
var object = args.join(' ');



var errOrOk = function(err) {
	console.log(err || 'OK');
};



if (verb === 'query') {
	rip.querySong(object, function(err, items) {
		if (err) { throw err; }

		items.forEach(function(it) {
			console.log(['* ', it.artist, ' - ', it.title, ' -> ', it.url].join(''));
		});
	});
}
else if (verb === 'get') {
	rip.fetchSong(object, errOrOk);
}
else {
	console.log([
		'supported commands are:',
		'  query <song name>',
		'  get <song url>'
	].join('\n'));
}

