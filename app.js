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

function response(db, agent, message) {
  var log = { input: agent.query, output: message, timestamp: Date.now() };
  let dbo = db.db(dbName);

  return dbo.collection(logsCol).insertOne(log).then(function() {
    db.close();

    return agent.add(response);
  });
}

function getProducts(db) {
  let dbo = db.db(dbName);

  return dbo.collection(productsCol).find({}).toArray().then(function(items) {
    let quantity = items.length;
    let names = [];

    if (quantity == 0) return names;

    for (let i = 0; i < quantity; i++) {
      names.push(items[i].name);
    }

    return names;
  });
}

function getSizes(db) {
  let dbo = db.db(dbName);

  return dbo.collection(sizesCol).find({}).toArray().then(function(items) {
    let quantity = items.length;
    let names = [];

    if (quantity == 0) return names;

    for (let i = 0; i < quantity; i++) {
      names.push(items[i].name);
    }

    return names;
  });
}

function getColors(db) {
  let dbo = db.db(dbName);

  return dbo.collection(colorsCol).find({}).toArray().then(function(items) {
    let quantity = items.length;
    let names = [];

    if (quantity == 0) return names;

    for (let i = 0; i < quantity; i++) {
      names.push(items[i].name);
    }

    return names;
  });
}

function welcomeIntent(agent) {
  var db;

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;
    return getProducts(db);
  })
  .then(function(products) {
    let message = 'Hello, welcome to our shop. We have ' + products.length + ' products: ';
    message += products.join(', ') + '. Which product do you want to buy?';

    return response(db, agent, message);
  })
  .catch(function(err) {
    console.log(err);
  });
}

function fallbackIntent(agent) {
  var db;
  var message = 'Entered fallbackIntent function';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return response(db, agent, message);
  });
}

function productIntent(agent) {
  var db;
  var message = '';
  var product = (typeof agent.parameters.product !== 'undefined') ? agent.parameters.product : '';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return getProducts(db);
  })
  .then(function(products) {
    let quantity = products.length;

    if (quantity == 0) {
      let message = 'We\'re sorry, there is something wrong with our system, please try again later.';

      return response(db, agent, message);
    }

    let productExists = false;
    let response;

    for (let i = 0; i < quantity; i++) {
      if (products[i] == product) {
        productExists = true;
        break;
      }
    }

    if (productExists) {
      return getSizes(db).then(function(sizes) {
        let quantity = sizes.length;
        let message;

        if (quantity == 0) {
          message = 'We\'re sorry, there is something wrong with our system, please try again later.';
        } else {
          message = 'You want to buy a ' + product + '. Which size would you like? ';
          message += products.join(', ') + '?';
        }

        return response(db, agent, message);
      });
    } else {
      message = 'Sorry, I don\'t get that. We have ' + quantity + ' products: ';
      message += products.join(', ') + '. Which product do you want to buy?';

      return response(db, agent, message);
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}

function sizeIntent(agent) {
  var db;
  var response = 'Entered sizeIntent function';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return response(db, agent, response);
  });
}

function colorIntent(agent) {
  var db;
  var response = 'Entered colorIntent function';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return response(db, agent, response);
  });
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
