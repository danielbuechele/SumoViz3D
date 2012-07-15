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
		time: parseFloat(data[0]),
		pedid: parseInt(data[1]),
		x: parseFloat(data[2]),
		y: parseFloat(data[3]),
		z: parseFloat(data[4]),
		level: parseInt(data[5]),
		density: parseFloat(data[6]),
	}, function (err, res) {
		if (err) {} else {}
	});
	
	
}

var input = fs.createReadStream('data.txt');
readLines(input, func);




/*

 
 */