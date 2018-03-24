const util = require('util');
const exec = require('child_process').exec;
const http = require('http');
const url = require('url');
const fs = require('fs');
var crypto = require('crypto');
const port = 80;

var express = require('express');
var app = express();

function dectalk(words, md5sum) {
	return new Promise((resolve, reject) => {
		exec('say -w ' + md5sum + '.wav "[:phoneme on][:volume up 100]' + words + '"', (error, stdout, stderr) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(stdout);
		});
	})
}

function sendReadFile(pathname, res) {
	fs.readFile(pathname, function(err, data) {
		if (err) {
			res.statusCode = 500;
			res.end('error getting file: '+err);
		} else {
			// if the file is found, set Content-type and send data
			res.setHeader('Content-type', 'audio/wav' || 'text/plain');
			res.end(data);
		}
	});
}

app.get('/tts/*', function(req, res){
	
	///
	var songText = decodeURI(req.url.substring(5)).replace(/(\r\n|\n|\r)/gm,"");
	var md5sum = crypto.createHash('md5').update(songText).digest('hex');
	if (songText.length > 2000) {
		//ok, calm down buddy that's a bit long.
		res.statusCode = 500;
		res.end('input must be less than 2000 characters');
	}
	///
	
	if (!songText) {
		res.statusCode = 500;
		res.end('must provide text');
		return;
	}

	const ext = '.wav';
	var pathname = './' + md5sum + ext;

	fs.exists(pathname, function(exist) {
		if (!exist) {
			dectalk(songText, md5sum).then(stdout => {
				sendReadFile(pathname, res);
				console.log(req.connection.remoteAddress+' - NEW REQUEST - ' + songText.substr(0, 50) + '\n' + md5sum);
			}).catch(err => {
				res.statusCode = 500;
				res.end('error generating audio: '+err);
			})
			return;
		}
		// read file from file system
		sendReadFile(pathname, res);
		console.log(req.connection.remoteAddress+' - REQUEST - ' + songText.substr(0, 50) + '\n' + md5sum);
	});

})

app.get('/sing.html', (req, res) => {

    res.status(301).redirect('https://69420.me/sing.html');

})

app.listen(port);

console.log('Server listening on port '+port);