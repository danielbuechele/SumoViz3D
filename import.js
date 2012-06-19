var cradle = require('cradle');


var db = new(cradle.Connection)().database('pedestrians');



var fs = require('fs');

function readLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
	remaining += data;
	var index = remaining.indexOf('\n');
	while (index > -1) {
	  var line = remaining.substring(0, index);
	  remaining = remaining.substring(index + 1);
	  func(line);
	  index = remaining.indexOf('\n');
	}
  });

  input.on('end', function() {
	if (remaining.length > 0) {
	  func(remaining);
	}
  });
}

function func(data) {
	data = data.replace("\r","");
	data = data.split(" ");
	
	console.log(data[0]);
	
	
	db.save({
		timecode: data[0],
		pedid: data[1],
		x: data[2],
		y: data[3],
		z: data[4],
		level: data[5],
		density: data[6],
	}, function (err, res) {
		if (err) {} else {}
	});
	
	
}

var input = fs.createReadStream('data.txt');
readLines(input, func);




/*

 
 */