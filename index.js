const express = require('express');
const path = require('path');
const app = express();
var bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
var fs = require('fs');
var axios = require('axios');
let {PythonShell} = require('python-shell');

/*** INITIALIZATION AND APPLICATION STARTUP ***/

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Data files for session
const dataFile = './data/session.json';
var data = {};
var currCollectionUploadId = null;

// Current data for current run
var currRun = {
	id: '',
	name: '',
	time: '',
	collections: [],
	interviews: "",
	interviewees:"",
	keywordList: [],
	total: 0 // Progress of the run
};

/*
 * Initializes the data into the session by reading in the current collections
 * located in data/corpus-files. It also reads in the data located in the data
 * file and keeps that in backend memory.
 */
 function initializeData() {
 	console.log("Initializing data from session.json...")
 	var rawData = fs.readFileSync(dataFile);
 	data = JSON.parse(rawData);

 	// Reads in current collections located in data/corpus-files
 	let collections = fs.readdirSync('./data/corpus-files').filter(function (file) {
		return fs.statSync('./data/corpus-files/' + file).isDirectory();
	});

	// Deletes any collections in the data JSON structure that don't appear
	// within our folder and prints a warning message.
	var remove = [];
	for (var c in data['collections']) {
		if (!collections.includes(c)) {
			remove.push(c);
		}
	}
	for (var i in remove) {
		delete data[remove[i]];
		console.log('WARNING: ' + remove[i] + ' collection doesn\'t exist in data/corpus-files. Please either add the files or delete the entry from session.json.');
	}
 }

// Serves the session
const port = process.env.PORT || 5000;
app.listen(port, function() {
	// Creates a session JSON file if one does not exist and writes to it
	const rawContents = `{ 
		"keyword-lists": {},
		"collections": {},
		"runs": {}
	}`;

	if (!fs.existsSync(dataFile)) {
		fs.writeFileSync(dataFile, rawContents, { flag: 'wx' }, function (err) {
		    if (err) throw err;
		});
		initializeData();
	} else {
		initializeData();
	}
});
console.log(`OHTAP Subcorpora Tool launched at localhost:${port}\n`);

/** FUNCTIONS FOR UPDATING SESSION.JSON **/

// Writes to the session.json file
function saveToSessionFile() {
	fs.writeFile(dataFile, JSON.stringify(data), function (err) {
		if (err) {
			console.log("ERROR: could not save to session.json (" + err + ")");
		}
	});
}

// Multer upload storage
//Upload funtion here
var uploadFunction = function(_type) {
	var storage = multer.diskStorage({
		destination: function(req, file, cb) {
			var dest = "./data/metadata-files/";
			if (_type === "collection") {
				dest = "./data/corpus-files/" + currCollectionUploadId + "/";
				if (!fs.existsSync(dest)){
				    fs.mkdirSync(dest);
				}
			}
			cb(null, dest);
		},
		filename: function(req, file, cb) {
			var filename = file.originalname;
			if (_type === "metadata") {
				filename = "metadata" + Date.now() + path.extname(file.originalname);
			}
			cb(null, filename);
		}
	});

	var upload = multer({ storage: storage }).array('file');

	return upload;
}

app.post("/upload_collection", function(req, res) {
	var currUploadFunction = uploadFunction('collection');
	currUploadFunction(req, res, function(err) {
		if (err) {
			console.log("Failed to upload collection: " + err + "\n");
			return res.status(500).json(err);
		}
		console.log("Collection uploaded!\n");
		return res.status(200).send(req.file);
	});
});

app.post("/upload_metadata", function(req, res) {
	var currUploadFunction = uploadFunction('metadata');
	currUploadFunction(req, res, function(err) {
		if (err) {
			console.log("Failed to upload metadata file: " + err + "\n");
			return res.status(500).json(err);
		}
		console.log("Metadata file uploaded!\n");
		return res.status(200).send(req.file);
	})
});

// Retrieves all the collections in JSON format
app.get("/get_metadata_files", function (req, res) {
	var metadataFiles = [];
	var currPath = "./data/metadata-files";
	fs.readdirSync(currPath).forEach(function(file, index) {
		if (file !== ".gitkeep") {
			metadataFiles.push(file);
		}
	});
	res.status(200).send(metadataFiles);
});

//Upload function seems to end here

/** PYTHON PROCESS AND HELPER FUNCTIONS FOR RUNNING SUBCORPORA TOOL **/

/**
 * Parses the message sent from the Python script
 */
 function parsePythonMessage(msg) {
 	var obj = JSON.parse(msg);
 	var _type = obj["type"];

	switch(_type) {
		case "progress-message":
			currRun.statusMessage = obj["content"];
			break;
		case "progress":
			currRun.total = parseInt(obj["content"]);
			break;
	} 	
 }

// Resets the current run and sets the ID, name, and date.
app.post("/set_run_name", function (req, res) {
	currRun = {}; // We don't want any residual data from previous runs, so we just assume it's new each time this is called.

	var currData = req.body.data;
	currRun.name = currData.name;
	currRun.time = currData.time;
	console.log("Current run name set to " + currRun.name + ", current time set to " + currRun.time + "\n");

	// Gives the run an ID composed of the name and the time
	currRun.id = currRun.name.replace(/\s/g, "") + "-" + currRun.time.replace(/\//g, "").replace(/\s/g, "").replace(/:/g, "");
	console.log("Current run ID set to " + currRun.id + "\n");

	currRun.total = 0;

	res.sendStatus(200);
});

// Sets the collections used for this particular run
app.post("/choose_collections", function (req, res) {
	var currData = req.body;
	currRun.collections = currData.data;
	console.log("Current run collections updated to " + currRun.collections + "\n");

	res.sendStatus(200);
});

// Sets the keyword lists used for this particular run
app.post("/choose_keywords", function (req, res) {
	var currData = req.body;
	currRun.keywordList = currData.data;
	console.log("Current run keyword lists updated to " + currRun.keywordList + "\n");
	res.sendStatus(200);
});
app.post("/choose_metadata", function (req, res) {
	var currData = req.body;
	currRun.interviews = currData.data;
	console.log("Current run interview metadata updated to " + currRun.interviews + "\n");

	res.sendStatus(200);
});

/**
 * Runs the Python script and maintains communication between the script and our Node backend.
 */
app.post("/run_python_script", function (req, res) {
	var currData = req.body;
	currRun.interviewees = currData.data;
	console.log("Current run interviewees metadata file updated to " + currRun.interviewees + "\n");

	console.log("Running python script\n");
	currRun.statusMessage = "Starting subcorpora run...";
	currRun.afterRun = true;
	// Puts the data that we need to pass to the Python script into a JSON object
	var runData = {
		"id": currRun["id"],
		"name": currRun["name"],
		"date": currRun["time"],
		"interviews": currRun["interviews"],
		"interviewees": currRun["interviewees"],
		"collections": [],
		"keywordList": []
	};

	for (var c in currRun["collections"]) {
		var cId = currRun["collections"][c];
		var curr = data["collections"][cId];
		runData["collections"].push(curr);

	}
	for (var k in currRun.keywordList) {
		var kId = currRun.keywordList[k];
		var curr = data["keyword-lists"][kId];
		runData["keywordList"].push(curr);
	}

	// Options for the Python scripts that we are going to run
	let options = {
		mode: 'text',
		pythonOptions: ['-u'], // Get print results in real-time
		args: [JSON.stringify(runData)],
		scriptPath: __dirname + '/src'
	};

	let pyshell = new PythonShell('./tool_script.py', options);
	pyshell.on('message', function(message) {
		parsePythonMessage(message);
		console.log(message);
	});

	res.sendStatus(200);
});

// Gets the current progress of the Python script
app.get("/get_python_progress", function (req, res) {
	res.status(200).send({total: currRun.total, message: currRun.statusMessage});
});

/** DISPLAYING REPORT DATA **/

// Updates the clicked report from the Past Runs page
app.post("/update_clicked_report", function (req, res) {
	var currData = req.body;
	currRun.afterRun = false;
	currRun.id = currData.data;
	currRun.total = 100;

	console.log("Clicked report updated to " + currRun.id);
	
	res.sendStatus(200);
});

// Retrieves current data
app.get("/get_current_run_data", function (req, res) {
	if (!(currRun.id in data["runs"])) {
		var currRunData = fs.readFileSync("data/run.json");
		data["runs"][currRun.id] = JSON.parse(currRunData);
		saveToSessionFile();
	}
	res.status(200).send(data["runs"][currRun.id]);
	console.log("Data successfully sent to frontend for report");
});

// Updates the keyword contexts
app.post("/update_individual_run_keyword_contexts", function (req, res) {
	var currData = req.body;
	var individualRunName = currData.individualRunName;
	var newContexts = currData.contexts;

	data["runs"][currRun.id]["individual-reports"][individualRunName]["keyword-contexts"] = newContexts;

	saveToSessionFile();
	res.sendStatus(200);
});

app.get("/get_after_run", function (req, res) {
	res.status(200).send(currRun.afterRun);
});

/** GETTING, UPLOADING, AND UPDATING COLLECTIONS **/

// Retrieves all the collections in JSON format
app.get("/get_collections", function (req, res) {
	res.status(200).send(data["collections"]);
});

// Adds a new collection
app.post("/add_collection", function (req, res) {
	var currData = req.body;
	var collectionId = currData.id;
	console.log("Adding collection " + collectionId);
	data["collections"][collectionId] = {};
	currCollectionUploadId = collectionId;
	data["collections"][collectionId]["id"] = collectionId;
	data["collections"][collectionId]["name"] = currData.name;
	data["collections"][collectionId]["collection-count"] = currData.collection_count;
	data["collections"][collectionId]["shortened-name"] = currData.shortenedName;
	data["collections"][collectionId]["description"] = currData.description;
	data["collections"][collectionId]["themes"] = currData.themes;
	data["collections"][collectionId]["notes"] = currData.notes;

	// TODO: Add an upload

	saveToSessionFile();
	res.sendStatus(200);
});

// Edits the collections
app.post("/edit_collection", function (req, res) {
	var currData = req.body;
	var collectionId = currData.id;
	console.log("Editing collection " + collectionId);
	data["collections"][collectionId]["name"] = currData.name;
	data["collections"][collectionId]["shortened-name"] = currData.shortenedName;
	data["collections"][collectionId]["description"] = currData.description;
	data["collections"][collectionId]["themes"] = currData.themes;
	data["collections"][collectionId]["notes"] = currData.notes;

	saveToSessionFile();
	res.sendStatus(200);
});

// Deletes a collection
app.post("/delete_collection", function (req, res) {
	var currData = req.body;
	var collectionId = currData.id;
	console.log("Deleting collection " + collectionId);
	delete data["collections"][collectionId];

	// Deletes the folder and files of the collection
	var currPath = "./data/corpus-files/" + collectionId;
	if (fs.existsSync(currPath)) {
		fs.readdirSync(currPath).forEach(function(file, index) {
			var currFilePath = currPath + file;
			fs.unlinkSync(currFilePath);
		})
		fs.rmdirSync(currPath);
	}

	saveToSessionFile();
	res.sendStatus(200);
});

/** GETTING AND UPDATING KEYWORD LISTS **/

// Adds a new keyword list
app.post("/add_keyword_list", function (req, res) {
	var currData = req.body;
	var kId = currData.id;
	console.log("Adding keyword list " + kId);
	data["keyword-lists"][kId] = {};
	data["keyword-lists"][kId]["name"] = currData.name;
	data["keyword-lists"][kId]["version"] = currData.version;
	data["keyword-lists"][kId]["date-added"] = currData.date_added;
	data["keyword-lists"][kId]["include"] = currData.included.split(",");
	data["keyword-lists"][kId]["exclude"] = currData.excluded.split(",");

	saveToSessionFile();
	res.sendStatus(200);
});

// Edits the keyword list
app.post("/edit_keyword_list", function(req, res) {
	var currData = req.body;
	var kId = currData.id;
	console.log("Editing keyword list " + kId);
	data["keyword-lists"][kId]["name"] = currData.name;
	data["keyword-lists"][kId]["version"] = currData.version;
	data["keyword-lists"][kId]["date-added"] = currData.date_added;
	data["keyword-lists"][kId]["include"] = currData.included;
	data["keyword-lists"][kId]["exclude"] = currData.excluded;

	saveToSessionFile();
	res.sendStatus(200);
})
	
// Retrieves all the keyword lists in JSON format
app.get("/get_keywords", function (req, res) {
	res.status(200).send(data["keyword-lists"]);
});

// Deletes a keyword list
app.post("/delete_keyword_list", function (req, res) {
	var currData = req.body;
	var keywordId = currData.id;
	console.log("Deleting keyword list " + keywordId);
	delete data["keyword-lists"][keywordId];

	saveToSessionFile();
	res.sendStatus(200);
});

/** GETTING PAST RUNS **/
app.get("/get_past_runs", function (req, res) {
	res.status(200).send(data["runs"]);
});

// Deletes a past run
app.post("/delete_past_run", function (req, res) {
	var currData = req.body;
	var runId = currData.id;
	console.log("Deleting run " + runId);
	delete data["runs"][runId];

	saveToSessionFile();
	res.sendStatus(200);
});

/** GENERAL PAGE SERVICE **/

// The "catchall" handler: for any request that doesn't
// match one route above, send back React's index.html file.
// This needs to be the last route in index.js.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/public/index.html'));
});
