require('dotenv').config();
var port = process.env.PORT || 3000;

const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Button } = require('actions-on-google');
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
var logsCol = 'logs';
var ordersCol = 'orders';

function response(db, agent, message) {
  var log = { input: agent.query, output: message, timestamp: Date.now() };
  let dbo = db.db(dbName);

  return dbo.collection(logsCol).insertOne(log).then(function() {
    db.close();

    return agent.add(message);
  });
}

function saveOrder(db, agent, productName, sizeName, colorName) {
  var productId;
  var sizeId;
  var colorId;
  var message = 'We\'re sorry, there is something wrong with our system, please try again later.';
  var dbo = db.db(dbName);

  return dbo.collection(productsCol).findOne({name: productName})
    .then(function(product) {
      if (typeof product._id == 'undefined') {
        return agent.add(message);
      }

      productId = product._id.toString();

      return dbo.collection(sizesCol).findOne({name: sizeName});
    })
    .then(function(size) {
      if (typeof size._id == 'undefined') {
        return agent.add(message);
      }

      sizeId = size._id.toString();

      return dbo.collection(colorsCol).findOne({name: colorName});
    })
    .then(function(color) {
      if (typeof color._id == 'undefined') {
        return agent.add(message);
      }

      colorId = color._id.toString();

      let order = {
        product_id: productId,
        size_id: sizeId,
        color_id: colorId,
        timestamp: Date.now()
      };

      return dbo.collection(ordersCol).insertOne(order);
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

    return agent.add(new Card({
      title: 'Card Title',
      text: 'Card Text',
      image: {
        url: 'https://www.gstatic.com/devrel-devsite/v093b7aa18b25177253b89e71ebbebc6545f1e1e743b427cede8842a6f63894fd/dialogflow/images/lockup.svg',
        accessibilityText: 'Card Image',
      },
      buttons: new Button({
        title: 'Button Title',
        url: 'https://www.google.com',
      }),
    }));

    return;

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
    let message;

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
          message += sizes.join(', ') + '?';
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
  var message = '';
  var product = (typeof agent.parameters.product !== 'undefined') ? agent.parameters.product : '';
  var size = (typeof agent.parameters.size !== 'undefined') ? agent.parameters.size : '';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return getSizes(db);
  })
  .then(function(sizes) {
    let quantity = sizes.length;

    if (quantity == 0) {
      let message = 'We\'re sorry, there is something wrong with our system, please try again later.';

      return response(db, agent, message);
    }

    let sizeExists = false;
    let message;

    for (let i = 0; i < quantity; i++) {
      if (sizes[i] == size) {
        sizeExists = true;
        break;
      }
    }

    if (sizeExists) {
      return getColors(db).then(function(colors) {
        let quantity = colors.length;
        let message;

        if (quantity == 0) {
          message = 'We\'re sorry, there is something wrong with our system, please try again later.';
        } else {
          message = 'You want to buy a ' + product + ' in size ' + size + '. This product has the following colors: ';
          message += colors.join(', ') + '. Which color do you want?';
        }

        return response(db, agent, message);
      });
    } else {
      message = 'Sorry, I don\'t get that. We have ' + quantity + ' sizes: ';
      message += sizes.join(', ') + '. Which size do you want to buy?';

      return response(db, agent, message);
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}

function colorIntent(agent) {
  var db;
  var message = '';
  var product = (typeof agent.parameters.product !== 'undefined') ? agent.parameters.product : '';
  var size = (typeof agent.parameters.size !== 'undefined') ? agent.parameters.size : '';
  var color = (typeof agent.parameters.color !== 'undefined') ? agent.parameters.color : '';

  return MongoClient.connect(dbUrl, dbOptions)
  .then(function(_db) {
    db = _db;

    return getColors(db);
  })
  .then(function(colors) {
    let quantity = colors.length;

    if (quantity == 0) {
      let message = 'We\'re sorry, there is something wrong with our system, please try again later.';

      return response(db, agent, message);
    }

    let colorExists = false;
    let message;

    for (let i = 0; i < quantity; i++) {
      if (colors[i] == color) {
        colorExists = true;
        break;
      }
    }

    if (colorExists) {
      message = 'You have just bought a ' + color + ' ' + product + ' in size ' + size + '. Thank you for your purchase!';

      return saveOrder(db, agent, product, size, color).then(function() {
        return response(db, agent, message);
      });
    } else {
      message = 'Sorry, I don\'t get that. We have ' + quantity + ' colors: ';
      message += colors.join(', ') + '. Which color do you want to buy?';

      return response(db, agent, message);
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  //console.log('webhookClient.intent:');
  //console.log(agent.intent);
  //console.log('webhookClient.action:');
  //console.log(agent.action);
  //console.log('webhookClient.parameters:');
  //console.log(agent.parameters);
  //console.log('webhookClient.contexts:')
  //console.log(agent.contexts);
  //console.log('webhookClient.requestSource:');
  //console.log(agent.requestSource);
  //console.log('webhookClient.originalRequest:');
  //console.log(agent.originalRequest);
  //console.log('webhookClient.query:')
  //console.log(agent.query);

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

app.get('/api/getOrders', function(req, res) {
  res.setHeader('Content-Type', 'application/json');

  MongoClient.connect(dbUrl, dbOptions, function(err, db) {
    if (err) throw err;

    let dbo = db.db(dbName);

    dbo.collection(ordersCol).find({}).toArray(function(err, orders) {
      if (err) throw err;

      db.close();

      res.send(JSON.stringify({ success: true, data: orders }));
    });
  });
});

app.listen(port, () => console.log(`Listening to port ${port}!`));
