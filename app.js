require('dotenv').config();
const express = require('express');
const app = express();
var port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
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

app.get('/', (req, res) => res.send('Hello World!'));

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
