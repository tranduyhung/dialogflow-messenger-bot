require('dotenv').config();
var port = process.env.PORT || 3000;

const { WebhookClient } = require('dialogflow-fulfillment');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
  if (err)
    throw err;

  console.log(`Connected to ${url}`);
  db.close();
  console.log(`Disconnected from ${url}`);
})

function welcomeIntent(agent) {
  agent.add('Hello, this is a welcome message from Node.js!');
}

function fallbackIntent(agent) {
  agent.add('This is a fallback message from Node.js!');
}

function productIntent(agent) {
  
}

function sizeIntent(agent) {

}

function colorIntent(agent) {

}
app.get('/', (req, res) => res.send('Hello World!'));

app.post('/', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  //console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  //console.log('Dialogflow Request body: ' + JSON.stringify(req.body));

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcomeIntent);
  intentMap.set('Default Fallback Intent', fallbackIntent);
  intentMap.set('product', productIntent);
  intentMap.set('size', sizeIntent);
  intentMap.set('color', colorIntent);
  agent.handleRequest(intentMap);

  //res.setHeader('Content-Type', 'application/json');
  //res.send(JSON.stringify({ success: true, message: 'Hello World!' }));
});

app.post('/api/getProduct', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (typeof req.body.name === 'undefined') {
    res.send(JSON.stringify({ success: false, message: 'Invalid product name' }));
  }

  res.end();
});

app.post('/api/getColor', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (typeof req.body.name === 'undefined') {
    res.send(JSON.stringify({ success: false, message: 'Invalid color' }));
  }

  res.end();
});

app.post('/api/getSize', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (typeof req.body.name === 'undefined') {
    res.send(JSON.stringify({ success: false, message: 'Invalid size' }));
  }

  res.end();
});

app.listen(port, () => console.log(`Listening to port ${port}!`));
