# Winnow: Generate relevant subcorpora from your oral history collections for easier analysis.

Winnow is a tool that generates relevant subcorpora based on metadata and lists of researcher-generated keywords. Winnow provides researchers with smaller subsets of large collections of texts that they can then analyze via traditional close-reading methods or with out-of-the-box textual analysis tools or custom scripts.

For more implementation details about the tool and its use cases, please see the [Wiki](https://github.com/ohtap/subcorpora-tool/wiki).

## Software Engineers

* Hilary Sun (hilary@cs.stanford.edu), Winter/Spring/Summer 2019

## Running the application

To run the application, follow the following steps.

### Installation

You only need to do this installation process once.

#### Cloning the repository

Clone the repository, located here: [https://github.com/ohtap/subcorpora-tool](https://github.com/ohtap/subcorpora-tool).  Go into the `subcorpora-tool` directory. You can run this command in your terminal:

```
# Clone the repository
git clone git@github.com:ohtap/subcorpora-tool.git

# Enter into the subcorpora-tool directory
cd subcorpora-tool
```
You can also navigate to the link above and hit the button that says "Code"

Then click download ZIP to download a ZIP file with all the code

### Downloading Other Programs
The program uses Python 3, so you must have that to use Winnow. 

You will also need to download Node.js (which can be done at https://nodejs.org/en/) as well as all of the python packages in ```requirements.txt```

### Installing the Node modules

To install the Node modules, run:

```
npm install
```

## Running the application

### Building the static files

We need to build the static HTML files to display. Run:

```
npm run build
```

You do not need to run this command again if you never update the React.js files.

### Running it locally

To run the web application locally, run:

```
npm run start
```

Currently, this runs the command ```node index.js```. You should see the line `OHTAP Subcorpora Tool launched` in the terminal after running this command if the web application is successfully running locally.

You can then navigate to [http://localhost:5000/](http://localhost:5000/) in your web browser to see the web application.

## Running tests

Running this command will run any Jest tests in watch mode related to React files changed:

```
npm test
```

Running this command will run all Python unit tests for the `tool_script.py`.

```
python src/tool_script_test.py
```

## Results

Results will be displayed on the winnow interface. On top of that, csv files will appear in the folder listing. There will be one for each keyword giving usage over time. Another will give you the number of uses of each word. The final will give you demographic data for all interviews that had one of the keywords. Remember that Winnow often turns up false positives, and the data in these csv files is the same. Should not be used beyond as a preliminary summary. 

## Directory structure
```
.
|	+--
+-- build				# Contains the built static HTML files
+-- data 				# Contains data files and uploads
|	+-- corpus-files	# Uploaded corpus text files
|	+-- metadata-files	# Uploaded metadata CSV files
|	+-- runs			# Files from runs
|	+-- run.json 		# JSON file containing the data from the last run made
|	+-- session.json 	# JSON file containing all the data from this session
+-- node_modules		# Folder containing Node modules
+-- public				# Contains default HTML
+-- src 				# Contains all the React files
|	+-- containers		# All the React JavaScript files--our frontend code
+-- .gitignore			# List of files and folders to ignore
+-- index.js 			# File containing all of our backend code
+-- LICENSE				# MIT license information
+-- package.json 		# Node modules
+-- package-lock.json 	# Node modules
+-- README.md 			# Instructions for the web app
```
