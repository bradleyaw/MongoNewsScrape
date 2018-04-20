var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 8080;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrapeTC";

// Initialize Express
var app = express();

////////////////////////
// Configure middleware
////////////////////////

// handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// set the public folder as static
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

app.get("/scrape", function (req, res) {
  axios.get("https://techcrunch.com/").then(function (response) {

  var $ = cheerio.load(response.data);
    console.log($);

    $("h2 a").each(function (i, element) {
      var result = {};

      result.title = $(this)
        .text();
      result.link = $(this)
        .attr("href");
      result.summary = $(this)
      .parent().parent()  
      .find("p")
      .text();

      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          return res.json(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({
    _id: req.params.id
  })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { comment: dbNote._id },
        { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
