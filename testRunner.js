'use strict';

var fs = require('fs');
var stream = require('stream');
var crypto = require('crypto');

var x2j = require('./xml2json');
var j2x = require('./json2xml');
var j2y = require('./json2yaml');
var xsd2j = require('./xsd2json');

var passing = 0;
var failing = 0;

function lines(s) {
	return s.split('\n');
}

function diff(s1,s2) {
	var red = '\x1b[31m';
	var green = '\x1b[32m';
	var normal = '\x1b[0m';
	var l1 = lines(s1);
	var l2 = lines(s2);
	var top = l1.length > l2.length ? l2.length : l1.length;
	for (var l=0;l<top;l++) {
		if (l1[l] != l2[l]) {

			console.log('Line '+(l+1));
			var cs = Math.max(0,l-3);
			for (var c=cs;c<l;c++) {
				console.log('  '+l1[c]);
			}
			console.log('- '+red+l1[l]+normal);
			console.log('+ '+green+l2[l]+normal);
			cs = Math.min(top,l+4);
			for (var c=l+1;c<cs;c++) {
				console.log('  '+((l1[c] == l2[c]) ? green : red)+l1[c]+normal);
			}
			break;
		}
	}
}

function runXmlTest(filename,components) {
	var stem = '';
	for (var c=0;c<components.length-1;c++) {
		stem += (stem ? '.' : '') + components[c];
	}

	var exists = false;
	try {
		fs.statSync('out/'+stem+'.json',fs.R_OK);
		console.log('  Convert and compare to JSON');
		exists = true;
	}
	catch(err) {}

	if (exists) {
		var xml = fs.readFileSync('test/'+filename,'utf8');
		var obj = x2j.xml2json(xml,{"attributePrefix": "@","valueProperty": false, "coerceTypes": false});
		var json = JSON.stringify(obj,null,2);
		var compare = fs.readFileSync('out/'+stem+'.json','utf8');
		compare = compare.replaceAll('\r\n','\n');

		if (json == compare) {
			passing++;
		}
		else {
			diff(json,compare);
			console.log('  Fail');
			failing++;
		}
	}
}

function runXsdTest(filename,components) {
	var stem = '';
	for (var c=0;c<components.length-1;c++) {
		stem += (stem ? '.' : '') + components[c];
	}

	var exists = false;
	try {
		fs.statSync('out/'+stem+'.json',fs.R_OK);
		console.log('  Convert and compare to JSON');
		exists = true;
	}
	catch(err) {}

	if (exists) {
		var xml = fs.readFileSync('test/'+filename,'utf8');
		var j1 = x2j.xml2json(xml,{"attributePrefix": "@","valueProperty": false, "coerceTypes": false});
		var obj = xsd2j.getJsonSchema(j1,'test/'+filename);
		var json = JSON.stringify(obj,null,2);
		var compare = fs.readFileSync('out/'+stem+'.json','utf8');
		compare = compare.replaceAll('\r\n','\n');

		if (json == compare) {
			passing++;
		}
		else {
			diff(json,compare);
			console.log('  Fail');
			failing++;
		}
	}
}

function runJsonTest(filename,components) {
	var stem = '';
	for (var c=0;c<components.length-1;c++) {
		stem += (stem ? '.' : '') + components[c];
	}

	var	exists = false;
	try {
		fs.statSync('out/'+stem+'.xml',fs.R_OK);
		console.log('  Convert and compare to XML');
		exists = true;
	}
	catch(err) {}

	if (exists) {
		var json = fs.readFileSync('test/'+filename,'utf8');
		var obj = JSON.parse(json);
		var xml = j2x.getXml(obj,'@','',2);
		var compare = fs.readFileSync('out/'+stem+'.xml','utf8');
		compare = compare.replaceAll('\r\n','\n');

		if (xml == compare) {
			passing++;
		}
		else {
			diff(xml,compare);
			console.log('  Fail');
			failing++;
		}
	}
}

function runYamlTest(filename,components) {
	var stem = '';
	for (var c=0;c<components.length-1;c++) {
		stem += (stem ? '.' : '') + components[c];
	}

	var	exists = false;
	try {
		fs.statSync('out/'+stem+'.yaml',fs.R_OK);
		console.log('  Convert and compare to YAML');
		exists = true;
	}
	catch(err) {}

	if (exists) {
		var json = fs.readFileSync('test/'+filename,'utf8');
		var obj = JSON.parse(json);
		var yaml = j2y.getYaml(obj);
		var compare = fs.readFileSync('out/'+stem+'.yaml','utf8');
		compare = compare.replaceAll('\r\n','\n');

		if (yaml == compare) {
			passing++;
		}
		else {
			diff(yaml,compare);
			console.log('  Fail');
			failing++;
		}
	}
}

process.exitCode = 1; // in case of crash

var tests = fs.readdirSync('test');
for (var t in tests) {
	var filename = tests[t];
	console.log(filename);
	var components = filename.split('.');
	if (components[components.length-1] == 'xml') {
		runXmlTest(filename,components);
	}
	else if (components[components.length-1] == 'xsd') {
		runXsdTest(filename,components);
	}
	else if (components[components.length-1] == 'json') {
		runJsonTest(filename,components);
		runYamlTest(filename,components);
	}
}

console.log(passing + ' passing, ' + failing + ' failing');
process.exitCode = (failing === 0) ? 0 : 1;