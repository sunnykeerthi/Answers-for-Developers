const { Socket } = require("dgram");
const express = require("express");
const app = express();
const expbs = require("express-handlebars");
const { options } = require("./routes/routes.js");
const port = process.env.PORT || 3500;
const routes = require("./routes/routes.js");

const { createServer } = require("http"); // you can use https as well
const socketIo = require("socket.io");

const server = createServer(app);
const io = socketIo(server, { cors: { origin: "*" } }); // you can change the cors to your own domain

app.use((req, res, next) => {
  req.io = io;
  return next();
});

const numToDigits = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

const hbs = expbs.create({
  extname: ".hbs",
  defaultLayout: "index",

  helpers: {
    getFirstImage: (options) => {
      return options[0];
    },
    changeDateFormat: (options) => {
      var dateInput = new Date(options);
      return (
        dateInput.getMonth() +
        1 +
        "/" +
        dateInput.getDate() +
        "/" +
        dateInput.getFullYear()
      );
    },
    generateNutritionTable: (options) => {
      var genDom = "";
      for (var i = 0; i < options.length; i++) {
        var currStr = options[i].split("(")[0];
        if (i % 2 == 0) {
          genDom += '<div class="nutrition-detail">';
        }
        if (i % 2 == 0) {
          genDom += `<div class="left-box">
        ${currStr.substring(0, currStr.slice(1).search(/(\d+)/) + 1)}
        <br />
        <span>${currStr.substring(
          currStr.slice(1).search(/(\d+)/) + 1,
          currStr.length
        )}
        </span>
    </div>`;
        } else {
          genDom += `<div class="right-box">
          ${currStr.substring(0, currStr.slice(1).search(/(\d+)/) + 1)}
          <br />
          <span>${currStr.substring(
            currStr.slice(1).search(/(\d+)/) + 1,
            currStr.length
          )}</span>
          </div>`;
        }
        if (i % 2 != 0) {
          genDom += `</div><div class="separator-post"></div>`;
        }
      }
      return genDom;
    },
    indexPlusOne: (options) => {
      return options + 1;
    },
    getImageFromPhotoGallery: (options) => {
      return options[0].image.url;
    },
    listToString: (options) => {
      return options.join(", ");
    },
    generatePriceDollarSigns: (options) => {
      var num = numToDigits[options.toLowerCase()];
      var genDollars = "";
      for (var i = 0; i < num; i++) {
        genDollars += '<i class="fa fa-dollar"></i>';
      }
      return genDollars;
    },
    generateHours: (options) => {
      var timingsRetuned = unflattenHoursData(options);
      var res = [];
      timingsRetuned.forEach((item) => {
        const keys = Object.keys(item);

        for (var i in keys) {
          var k = keys[i];
          res.push({
            day: k,
            open: item[k].openIntervals[0].start,
            close: item[k].openIntervals[0].end,
          });
        }
      });
      return res;
    },
    getRatingPercentage: (options) => {
      return (options / 5) * 100;
    },
    getCookTime: (prepTime, cookTime) => {
      var retVal;
      prepTime == cookTime
        ? (retVal = prepTime)
        : (retVal = cookTime - prepTime);
      return retVal;
    },
    minToHrAndRoundToTwoDecimals: (options) => {
      return (options / 60).toFixed(2).replace(".", ":");
    },
    getFirstLetter: (options) => {
      return options[0];
    },
    retrieveAuthorNameOnly: (options) => {
      return options.split(" (")[0];
    },
    averageRating: (options) => {
      var ratingsTotal = options.reduce((sum, ratingVar) => {
        return sum + ratingVar.rating;
      }, 0);
      return ratingsTotal / options.length;
    },
  },
});

unflattenHoursData = (inputData) => {
  var JS_Obj = inputData;
  var obj = JS_Obj;
  var res = [];
  const keys = Object.keys(obj);
  for (var i in keys) {
    var k = keys[i];
    res.push({ [k]: obj[k] });
  }
  return res;
};

/* configure express app */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

app.use(routes);

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
