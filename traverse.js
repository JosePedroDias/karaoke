(function(window) {
	'use strict';

	var _traverse = function trav(o, parent, arg, onValue) { // onValue({value, kind, parent, arg})
		var data = {value:o, parent:parent, arg:arg};
		var to = typeof o;
		if (to === 'string') {
			data.kind = 'string';
			onValue(data);
		}
		else if (to === 'object') {
			if (o === null) {
				data.kind = 'null';
				onValue(data);
			}
			else if (o instanceof Array) {
				data.kind = 'array';
				onValue(data);
				for (var i = 0, I = o.length; i < I; ++i) {
					trav(o[i], data, i, onValue);
				}
			}
			else if (o instanceof Date) {
				data.kind = 'date';
				onValue(data);
			}
			else if (o instanceof RegExp) {
				data.kind = 'regexp';
				onValue(data);
			}
			else {
				data.kind = 'object';
				onValue(data);
				for (var k in o) {
					if (o.hasOwnProperty(k)) {
						trav(o[k], data, k, onValue);
					}
				}
			}
		}
		else if (to === 'function') {
			data.kind = 'function';
			onValue(data);
		}
		else {
			data.kind = (to === 'number') ? 'number' : 'other';
			onValue(data);
		}
	};

	var traverse = function(o, onValue) {
		_traverse(o, null, null, onValue);
	};

	window.traverse = traverse;

	module.exports = traverse;
})(this);
