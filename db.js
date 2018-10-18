require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;

var productsCol = 'products';
var sizesCol = 'sizes';
var colorsCol = 'colors';
var ordersCol = 'orders';
var logsCol = 'logs';
var url = process.env.MONGODB_URI;
var dbName = process.env.MONGODB_DB;

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
  if (err) throw err;

  var dbo = db.db(dbName);

  dbo.createCollection(productsCol)
  .then(function() {
    return dbo.collection(productsCol).drop();
  })
  .then(function() {
    return dbo.createCollection(productsCol);
  })
  .then(function() {
    return dbo.createCollection(sizesCol);
  })
  .then(function() {
    return dbo.collection(sizesCol).drop();
  })
  .then(function() {
    return dbo.createCollection(sizesCol);
  })
  .then(function() {
    return dbo.createCollection(colorsCol);
  })
  .then(function() {
    return dbo.collection(colorsCol).drop();
  })
  .then(function() {
    return dbo.createCollection(colorsCol);
  })
  .then(function() {
    return dbo.createCollection(logsCol);
  })
  .then(function() {
    return dbo.collection(logsCol).drop();
  })
  .then(function() {
    return dbo.createCollection(logsCol);
  })
  .then(function() {
    return dbo.createCollection(ordersCol);
  })
  .then(function() {
    return dbo.collection(ordersCol).drop();
  })
  .then(function() {
    return dbo.createCollection(ordersCol);
  })
  .then(function() {
    var tshirt = { name: 'T-shirt' };

    return dbo.collection(productsCol).insertOne(tshirt);
  })
  .then(function() {
    var jean = { name: 'Jean' };

    return dbo.collection(productsCol).insertOne(jean);
  })
  .then(function() {
    var sizes = [
      { name: 'S' },
      { name: 'M' },
      { name: 'L' },
    ];

    return dbo.collection(sizesCol).insertMany(sizes);
  })
  .then(function() {
    var colors = [
      { name: 'Red' },
      { name: 'Green' },
      { name: 'Blue' },
    ];

    return dbo.collection(colorsCol).insertMany(colors);
  })
  .then(function() {
    dbo.collection(productsCol).find({}).toArray(function(err, products) {
      if (err) throw err;

      for (var i = 0; i < products.length; i++) {
        var product = products[i];

        dbo.collection(sizesCol).find({}).toArray(function(err, sizes) {
          if (err) throw err;

          dbo.collection(colorsCol).find({}).toArray(function(err, colors) {
            if (err) throw err;

            for (var j = 0; j < sizes.length; j++) {
              var size = sizes[j];
              for (var k = 0; k < colors.length; k++) {
                var color = colors[k];

                console.log(product.name + ' ' + size.name + ' ' + color.name);
              }
            }

            db.close();
          })
        })
      }
    })
  })
  .catch(function(err) {
    console.log(err);
  });
});
