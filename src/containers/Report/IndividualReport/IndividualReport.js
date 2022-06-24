import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import {Line, Bar, Doughnut} from 'react-chartjs-2';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import axios from 'axios';

const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const styles = theme => ({
  root: {

  },
  chart: {
    paddingRight: '20px',
  },
  title: {
    whiteSpace: 'pre',
  },
  paper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: theme.spacing.unit / 4,
  },
  table: {
    minWidth: 700,
  },
  row: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.background.default,
    },
  },
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const format = () => tick => tick;

// Helper function to sort an map; returns an array of key-value pairs, sorted
function sortMap(map) {
  var keyValues = [];

  for (var key in map) {
    keyValues.push([ key, map[key] ]);
  }

  keyValues.sort();

  return keyValues;
}

// Creates a dataset for a line graph
function createLineDataset(label, values) {
  var dataset = {
    label: label,
    fill: false,
    type: 'line',
    lineTension: 0.1,
    backgroundColor: 'rgba(75,192,192,0.4)',
    borderColor: 'rgba(75,192,192,1)',
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0.0,
    borderJoinStyle: 'miter',
    pointBorderColor: 'rgba(75,192,192,1)',
    pointBackgroundColor: '#fff',
    pointBorderWidth: 1,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: 'rgba(75,192,192,1)',
    pointHoverBorderColor: 'rgba(220,220,220,1)',
    pointHoverBorderWidth: 2,
    pointRadius: 1,
    pointHitRadius: 10,
    data: values
  };

  return dataset;
}

// Creates a dataset for a bar graph
function createBarDataset(label, values) {
  var dataset = {
    data: values,
    label: label,
    backgroundColor: 'rgba(255,99,132,0.2)',
    borderColor: 'rgba(255,99,132,1)',
    borderWidth: 1,
    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
    hoverBorderColor: 'rgba(255,99,132,1)',
  };

  return dataset;
}

// Creates a dataset for the doughnut graph
function createDoughnutDataset(values) {
  var dataset = {
    data: values,
    backgroundColor: [
    '#FF6384',
    '#36A2EB',
    '#FFCE56'
    ],
    hoverBackgroundColor: [
    '#FF6384',
    '#36A2EB',
    '#FFCE56'
    ]
  };

  return dataset;
}

class IndividualReport extends React.Component {
  constructor(props) {
    super(props);

    const keywordList = this.props.parentData.keywordList;
    const collection = this.props.parentData.collection;
    var individualRunName = this.props.parentData.collection + "-" + this.props.parentData.keywordList;

    this.state = {
      data: this.props.parentData.data['individual-reports'][individualRunName], // Passed from the parent report
      keywordList: keywordList,
      collection: collection,
      individualRunName: individualRunName,

      timeRangeInterviewData: {},
      timeRangeBirthYearData: {},
      keywordCountsData: {},
      intervieweeRaceData: {},
      intervieweeSexData: {},
      intervieweeEducationData: {},
      keywordsOverTimeData: {},
      keywordsOverTimeSelections: [],
      keywordsOverTimeChosen: [],

      keywordsFalseHits: 0,
      keywordsFlagged: 0,
    }
  }

  componentDidMount() {
    this.generateKeywordsOverTimeSelections();
    this.generateTimeRangeInterviewData();
    this.generateTimeRangeBirthYear();
    this.generateIntervieweeRaceData();
    this.generateIntervieweeSexData();
    this.generateIntervieweeEducationData();
    this.updateFalseHitsFlaggedPercentages();
    this.generateKeywordCountsData();
  }

  generateKeywordsOverTimeSelections = () => {
    var data = {};
    var newData = {};

    if ('keywords-over-time' in this.state.data) {
      data = this.state.data['keywords-over-time'];
    }

    var selections = [];
    var allKeywords = [];
    selections.push((<MenuItem value=""><em></em></MenuItem>));
    for (var k in data) {
      var item = (
        <MenuItem value={ k }>{ k }</MenuItem>
      );
      selections.push(item);
      allKeywords.push(k);
    }

    this.setState({ keywordsOverTimeSelections: selections, keywordsOverTimeChosen: allKeywords}, () => {
      this.generateKeywordsOverTimeData();
    });
  }

  handleKeywordsOverTimeChange = event => {
    this.setState({ keywordsOverTimeChosen: event.target.value }, () => {
      this.generateKeywordsOverTimeData();
    });
  }

  // Generates data for the keywords over time
  generateKeywordsOverTimeData = () => {
    var data = {};
    var newData = {
      'not-given': 0
    };

    if ('keywords-over-time' in this.state.data) {
      data = this.state.data['keywords-over-time'];
    }

    var labels = [];
    var dataSets = [];
    var addLabels = true;

    for (var i = 0; i < this.state.keywordsOverTimeChosen.length; i++) {
      var k = this.state.keywordsOverTimeChosen[i];
      if (k === "") {
        continue;
      }
      var v = data[k];
      var values = [];
      var sortedData = sortMap(v);

      for (var j = 0; j < sortedData.length; j++) {
        const kv = sortedData[j];
        const key = kv[0];
        const value = kv[1];

        if (key === 'Not given') {
          newData['not-given'] += value;
          continue;
        }

        if (addLabels) {
          labels.push(key);
        }
        values.push(value);
      }

      addLabels = false;
      dataSets.push(createLineDataset(k, values));
    }

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ keywordsOverTimeData: newData });
  }

  updateFalseHitsFlaggedPercentages = () => {
    var numFlagged = 0;
    var numFalseHits = 0;
    var data = this.state.data['keyword-contexts'];

    for (var file in data) {
      for (var i = 0; i < data[file].length; i++) {
        if (data[file][i]["flagged"]) {
          numFlagged += 1
        }
        if (data[file][i]["falseHit"]) {
          numFalseHits += 1
        }
      }
    }

    this.setState({ keywordsFalseHits: numFalseHits, keywordsFlagged: numFlagged });
  }

  handleCheckboxChange = (e) => {
    const item = e.target.name;
    var parts = item.split("-");
    const pos = parseInt(parts[0]);
    const file = parts.slice(1,).join("-");

    const isChecked = e.target.checked;
    const _type = e.target.value;

    var data = this.state.data;
    if (_type === "flagged") {
      var flagged = data['keyword-contexts'][file][pos]["flagged"];
      data['keyword-contexts'][file][pos]["flagged"] = !flagged;
    }
    if (_type === "falseHit") {
      var falseHit = data['keyword-contexts'][file][pos]["falseHit"];
      data['keyword-contexts'][file][pos]["falseHit"] = !falseHit;
    }

    this.setState({ data: data }, () => {
      axios.post("/update_individual_run_keyword_contexts", {
        individualRunName: this.state.individualRunName,
        contexts: data['keyword-contexts']
      })
      .catch(function (err) {
        console.log(err);
      });
      this.updateFalseHitsFlaggedPercentages();
    });
  }

  // Generates data for the time range graph of interviews
  generateTimeRangeInterviewData = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('time-range-interviews' in this.state.data) {
      data = this.state.data['time-range-interviews'];
    }

    var sortedData = sortMap(data);

    for (var i = 0; i < sortedData.length; i++) {
      const kv = sortedData[i];
      const key = kv[0];
      const value = kv[1];

      if (key === 'Not given') {
        newData['not-given'] = value;
        continue;
      }

      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createLineDataset('Time Range of Interviews', values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ timeRangeInterviewData: newData });
  }

  // Generates data for the time range graph of birth years of interviewees
  generateTimeRangeBirthYear = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('time-range-birth-year' in this.state.data) {
      data = this.state.data['time-range-birth-year'];
    }

    console.log(data);

    var sortedData = sortMap(data);

    for (var i = 0; i < sortedData.length; i++) {
      const kv = sortedData[i];
      const key = kv[0];
      const value = kv[1];

      if (key === 'Not given') {
        newData['not-given'] = value;
        continue;
      }

      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createBarDataset('Time Range of Interviewee Birth Dates (by decade)', values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ timeRangeBirthYearData: newData });
  }

  // Generates data for the circle chart for race of interviewees
  generateIntervieweeRaceData = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('race' in this.state.data) {
      data = this.state.data['race'];
    }

    for (var key in data) {
      const value = data[key];
      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createDoughnutDataset(values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ intervieweeRaceData: newData });
  }

  // Generates data for the circle chart for the sex of interviewees
  generateIntervieweeSexData = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('sex' in this.state.data) {
      data = this.state.data['sex'];
    }

    for (var key in data) {
      const value = data[key];
      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createDoughnutDataset(values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ intervieweeSexData: newData });
  }

  // Generates data for the circle chart for the sex of interviewees
  generateIntervieweeEducationData = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('education' in this.state.data) {
      data = this.state.data['education'];
    }

    for (var key in data) {
      const value = data[key];
      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createDoughnutDataset(values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ intervieweeEducationData: newData });
  }

  generateKeywordCountsData = () => {
    var labels = [];
    var values = [];
    var data = {};
    var newData = {};

    if ('keyword-counts' in this.state.data) {
      data = this.state.data['keyword-counts'];
    }

    var sortedData = sortMap(data);

    for (var i = 0; i < sortedData.length; i++) {
      const kv = sortedData[i];
      const key = kv[0];
      const value = kv[1];

      labels.push(key);
      values.push(value);
    }

    var dataSets = [];
    dataSets.push(createBarDataset('Counts of Keywords Found', values));

    newData['graph-data'] = {
      labels: labels,
      datasets: dataSets
    };

    this.setState({ keywordCountsData: newData });
  }

  render() {
    const { classes } = this.props;
    const {
      data,
      timeRangeInterviewData: triData,
      timeRangeBirthYearData: trbyData,
      intervieweeRaceData: irData,
      intervieweeSexData: isData,
      intervieweeEducationData: ieData,
      keywordsOverTimeData: kotData,
      keywordsOverTimeSelections: kotSelections,
      keywordCountsData: kcData,
    } = this.state;
    const contexts = this.state.data['keyword-contexts'];

    return (
      <div className={classes.root}>
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
            Basic Information
          </Typography>
          <Typography component="p">
            <b>Collection: </b>{ this.state.collection }<br />
            <b>Keyword list: </b>{ this.state.keywordList }<br />
            <b>Total keywords: </b>{ data['total-keywords'] }<br />
            <b>Total interviews: </b>{ data['total-interviews'] }<br />
            <b>&#x00025; interviews with keywords: </b>{ (data['total-interviews-with-keywords'] / data['total-interviews']) * 100 } &#x00025;<br />
            <b>Total keywords found: </b>{ data['total-keywords-found'] }<br /><br />
            <b>&#x00025; keyword contexts flagged: </b>{ (this.state.keywordsFlagged / data['total-keywords-found']) * 100 } &#x00025;<br />
            <b>&#x00025; keyword contexts marked as false hits: </b>{ (this.state.keywordsFalseHits / data['total-keywords-found']) * 100 } &#x00025;<br /><br />
            <b>Data directory and subcorpora folders:</b>{ this.state.data["runDirname"] }<br />
          </Typography>
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
            Keyword Use Over Time
          </Typography>
          <br />
          <Select
            multiple
            value={ this.state.keywordsOverTimeChosen }
            onChange={ this.handleKeywordsOverTimeChange }
            input={<Input id="select-multiple-chip" />}
            renderValue={keywordsOverTimeChosen => (
              <div className={classes.chips}>
                {keywordsOverTimeChosen.map(value => (
                  <Chip key={value} label={value} className={classes.chip} />
                ))}
              </div>
            )}
            MenuProps={MenuProps}
          >
            { kotSelections }
          </Select>
          <Typography component="p">
            <b>Total keywords not shown because there is no labeled year: </b>{ kotData['not-given'] }
          </Typography>
          <br />
          <Bar data={kotData['graph-data']} legend={{
            display: false
          }} />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
              Count of Keywords Found
            </Typography>
            <br />
            <Bar data={ kcData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
              Time Range of Interviews
          </Typography>
          <br />
          <Typography component="p">
            <b>Total interviews with no interview data given: </b>{ triData['not-given'] }
          </Typography>
          <br />
          <Bar data={ triData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
              Time Range of Interviewee Birth Dates
            </Typography>
            <br />
            <Typography component="p">
              <b>Total interviewees with no birth date given: </b>{ trbyData['not-given'] }
            </Typography>
            <br />
            <Bar data={ trbyData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
            Race of Interviewees
          </Typography>
          <br />
          <Typography component="p">
            <b>Total interviewees with no data on race: </b>{ isData['not-given']}
          </Typography>
          <Doughnut data={ irData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
            Sex of Interviewees
          </Typography>
          <br />
          <Typography component="p">
            <b>Total interviewees with no data on sex: </b>{ isData['not-given']}
          </Typography>
          <Doughnut data={ isData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
            Education of Interviewees
          </Typography>
          <br />
          <Typography component="p">
            <b>Total interviewees with no data on education: </b>{ ieData['not-given']}
          </Typography>
          <Doughnut data={ ieData['graph-data'] } />
        </Paper>
        <br />
        <Paper className={classes.paper} elevation={1}>
          <Typography variant="h5" component="h3">
              Keywords In Context
          </Typography>
          {Object.entries(contexts).map( ([key, value]) => (
            <div>
              <Typography paragraph>
                { key }
              </Typography>
              <Table className={classes.row}>
                <TableHead>
                  <TableRow>
                    <CustomTableCell>False Hit</CustomTableCell>
                    <CustomTableCell>Flagged</CustomTableCell>
                    <CustomTableCell>Context</CustomTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {value.map(v => (
                    <TableRow className={styles.row}>
                      <CustomTableCell component="th" scope="row">
                        <Checkbox checked={v.falseHit} name={v.id} value="falseHit" onClick={this.handleCheckboxChange} />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Checkbox checked={v.flagged} name={v.id} value="flagged" onClick={this.handleCheckboxChange} />
                      </CustomTableCell>
                      <CustomTableCell>{v.keywordContext[0]}<b>{v.keywordContext[1]}</b>{v.keywordContext[2]}</CustomTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <br />
            </div>
          ))}
        </Paper>
      </div>
    );
  }
}

IndividualReport.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(IndividualReport);
