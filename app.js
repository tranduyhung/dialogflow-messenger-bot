require('dotenv').config();
var port = process.env.PORT || 3000;

const { WebhookClient } = require('dialogflow-fulfillment');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var MongoClient = require('mongodb').MongoClient;
var dbUrl = process.env.MONGODB_URI;
var dbOptions = { useNewUrlParser: true };
var dbName = process.env.MONGODB_DB;
var productsCol = 'products';
var sizesCol = 'sizes';
var colorsCol = 'colors';
var itemsCol = 'items';
var logsCol = 'logs';

function welcomeIntent(agent) {
  console.log('Entered welcomeIntent function');

  var db;

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;
    let dbo = db.db(dbName);

    return dbo.collection(productsCol).find({}).toArray();
  })
  .then(function(products) {
    let quantity = products.length;

    console.log('Product quantity: ' + quantity);

    if (quantity == 0) return;

    let names = [];

    for (let i = 0; i < quantity; i++) {
      names.push(products[i].name);
    }

    let response = 'Hello, welcome to our shop. We have ' + quantity + ' products: ';
    response += names.join(', ') + '. Which product do you want to buy?';

    console.log('Response: ' + response);

    var log = { input: agent.query, output: response, timestamp: Date.now() };

    let dbo = db.db(dbName);
    return dbo.collection(logsCol).insertOne(log);
  })
  .then(function() {
    db.close();

    return agent.add(response);
  })
  .catch(function(err) {
    console.log(err);
  });
}

function fallbackIntent(agent) {
  console.log('Entered fallbackIntent function');
  agent.add('This is a fallback message from Node.js!');
}

function productIntent(agent) {
  console.log('Entered productIntent function');
}

function sizeIntent(agent) {
  console.log('Entered sizeIntent function');
}

function colorIntent(agent) {
  console.log('Entered colorIntent function');
}

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  /*
  console.log('webhookClient.intent:');
  console.log(agent.intent);
  console.log('webhookClient.action:');
  console.log(agent.action);
  console.log('webhookClient.parameters:');
  console.log(agent.parameters);
  console.log('webhookClient.contexts:')
  console.log(agent.contexts);
  console.log('webhookClient.requestSource:');
  console.log(agent.requestSource);
  console.log('webhookClient.originalRequest:');
  console.log(agent.originalRequest);
  console.log('webhookClient.query:')
  console.log(agent.query);
  */

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

app.get('/api/getProducts', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var db;

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;
    let dbo = db.db(dbName);

    return dbo.collection(productsCol).find({}).toArray();
  })
  .then(function(products) {
    res.send(JSON.stringify({ success: true, data: products }));

    db.close();
  })
  .catch(function(err) {
    console.log(err);
  });
});

app.get('/api/getColors', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  MongoClient.connect(dbUrl, dbOptions, function(err, db) {
    if (err) throw err;

    let dbo = db.db(dbName);

    dbo.collection(colorsCol).find({}).toArray(function(err, colors) {
      if (err) throw err;

      db.close();

      res.send(JSON.stringify({ success: true, data: colors }));
    });
  });
});

app.get('/api/getSizes', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  MongoClient.connect(dbUrl, dbOptions, function(err, db) {
    if (err) throw err;

    let dbo = db.db(dbName);

    dbo.collection(sizesCol).find({}).toArray(function(err, sizes) {
      if (err) throw err;

      db.close();

      res.send(JSON.stringify({ success: true, data: sizes }));
    });
  });
});

app.get('/api/getItems', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  MongoClient.connect(dbUrl, dbOptions, function(err, db) {
    if (err) throw err;

    let dbo = db.db(dbName);

    dbo.collection(itemsCol).find({}).toArray(function(err, items) {
      if (err) throw err;

      db.close();

      res.send(JSON.stringify({ success: true, data: items }));
    });
  });
});

app.listen(port, () => console.log(`Listening to port ${port}!`));
