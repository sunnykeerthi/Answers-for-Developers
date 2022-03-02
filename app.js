const express = require("express");
const app = express();
const expbs = require("express-handlebars");
const { options } = require("./routes/routes.js");
const port = process.env.PORT || 3500;
const routes = require("./routes/routes.js");

const hbs = expbs.create({
  extname: ".hbs",
  defaultLayout: "index",

  helpers: {
    getFirstImage: (options) => {
      console.log(JSON.stringify(options));
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
      console.log(options.length);
      var genDom = "";
      for (var i = 0; i < options.length; i++) {
        var currStr = options[i].split("(")[0];
        console.log(currStr);
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
  },
});
/* configure express app */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
