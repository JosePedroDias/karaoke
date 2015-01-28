'use strict';

var song = location.search.substring(1);

var renderLyrics = function(lines) {
	var ctnEl = document.createElement('div');
	ctnEl.className = 'lyrics';

	var dom = lines.map(function(l) {
		var dEl = document.createElement('div');
		var spanEls = l.map(function(w) {
			var sEl = document.createElement('span');
			sEl.appendChild( document.createTextNode(w[1]) );
			dEl.appendChild(sEl);
			return sEl;
		});
		ctnEl.appendChild(dEl);
		return spanEls;
	});

	document.body.appendChild(ctnEl);

	return dom;
};

var simplifyFormat = function(body) {
	return body.lines.map(function(l) {
		return l.words.map(function(w) {
			return [w.startTime, w.text];
		});
	});
};

var setupAudio = function(song) {
	var aEl = document.createElement('audio');
	document.body.appendChild(aEl);
	aEl.src = 'songs/' + song + '/track.mp3';
	return aEl;
};

var centerOnElement = function(el) {
	var h = el.offsetHeight;
	//document.body.scrollTop = el.offsetTop - (window.innerHeight - h) / 2;

	var dt = 0.05;
	var ratio = 0;
	var dr = 0.05;
	var onTick = function() {
		document.body.scrollTop = el.offsetTop - (window.innerHeight - h*ratio) / 2;	
		ratio += dr;
		if (ratio < 0.99) {
			setTimeout(onTick, dt*1000);
		}
	};
	onTick();
};

superagent
	.get('songs/' + song + '/metadata.json')
	.end(function(err, res) {
		if (err) { return window.alert('error fetching metadata!'); }

		var h1El = document.createElement('h1');
		h1El.appendChild( document.createTextNode(res.body.song.songName) );
		h1El.className = 'song';
		document.body.appendChild(h1El);

		h1El = document.createElement('h1');
		h1El.appendChild( document.createTextNode(res.body.song.singerName) );
		h1El.className = 'artist';
		document.body.appendChild(h1El);

		h1El = document.createElement('h1');
		h1El.appendChild( document.createTextNode('_') );
		h1El.className = 'progress';
		document.body.appendChild(h1El);
		var statusTN = h1El.firstChild;

		superagent
			.get('songs/' + song + '/lyrics.json')
			.end(function(err, res) {
				if (err) { return window.alert('error fetching lyrics!'); }

				var lines = simplifyFormat(res.body);
				//document.body.innerHTML = JSON.stringify(lines);

				var dom = renderLyrics(lines);
				//console.log(dom);

				var aEl = setupAudio(song);

				var currLineIndex = 0;
				var currSpanIndex = 0;
				var currSpans = dom[currLineIndex]
				var currSpan = currSpans[currSpanIndex];
				var currLine = currSpan.parentNode;
				centerOnElement(currLine);
				window.cl = currLine;

				aEl.addEventListener('timeupdate', function() {
					var t = aEl.currentTime;
					var d = aEl.duration;
					//console.log(aEl.currentTime.toFixed(2)+' s | '+(t/d*100).toFixed(1)+' %');

					statusTN.nodeValue = [aEl.currentTime.toFixed(2), ' s | ', (t/d*100).toFixed(1), ' %'].join('');

					var w = lines[currLineIndex][currSpanIndex];
					if (w[0] < t) {
						currSpan.className = 'active-word';

						if (currSpanIndex === 0) { // first word of line
							currLine.className = 'past-line';
							currLine = currSpan.parentNode;
							currLine.className = 'active-line';
							centerOnElement(currLine);
						}

						++currSpanIndex;

						currSpan = currSpans[currSpanIndex];
						if (!currSpan) { // last word of line
							++currLineIndex;
							currSpanIndex = 0;
							currSpans = dom[currLineIndex];
							currSpan = currSpans[currSpanIndex];
						}
					}
				});

				aEl.play();
			});
	});
