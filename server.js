/* server.js
 * Very simple static file server
 *
 * Nathan Johnson
 */

var express = require('express'),
	app = express(),
	path = require('path'),
	filePath = path.dirname(require.main.filename);

app.use(express.static(filePath));
app.listen(3004);
