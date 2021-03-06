const { provideCore, Matcher } = require("@yext/answers-core");
const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = process.env.API_KEY;
const EXPERIENCE_KEY = process.env.EXPERIENCE_KEY;
const APP_API_KEY = process.env.APP_API_KEY;
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
const core = provideCore({
  apiKey: API_KEY,
  experienceKey: EXPERIENCE_KEY,
  locale: "en",
  experienceVersion: "STAGING",
  endpoints: {
    universalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query",
    verticalSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
    questionSubmission:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
    status: "https://answersstatus.pagescdn.com",
    universalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
    verticalAutocomplete:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
    filterSearch:
      "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
  },
});

router.get("/", (req, res) => {
  getAllRecipes = async () => {
    try {
      const resp = await axios.get(
        `https://liveapi-sandbox.yext.com/v2/accounts/me/entities?limit=20&api_key=${APP_API_KEY}&v=20220101&entityTypes=ce_recipes&filter={ "$or": [{ "c_featured": { "$eq": true } }, { "c_carousel": { "$eq": true } }, { "c_latestNews": { "$eq": true } }] }`
      );

      let carouselList = [];
      let featuresList = [];
      let latest = [];
      resp.data.response.entities.forEach((item) => {
        if (item.c_carousel) {
          (item.banImage = item.photoGallery[0].image.url),
            carouselList.push(item);
        }
        if (item.c_featured) featuresList.push(item);
        if (item.c_latestNews) latest.push(item);
      });

      const ratingResp = await axios.get(
        `https://liveapi-sandbox.yext.com/v2/accounts/me/entities?limit=10&api_key=${APP_API_KEY}&v=20220101&entityTypes=ce_recipes&sortBy=[{"c_ratingNum":"DESCENDING"}]`
      );
      var data = {
        carouselList: carouselList,
        featuresList: featuresList,
        latest: latest,
        mostRated: ratingResp.data.response.entities.slice(0, 3),
        mostPopular: ratingResp.data.response.entities.slice(3, 6),
        random: ratingResp.data.response.entities.slice(7, 10),
      };
      res.render("main", {
        data: data,
      });
    } catch (err) {
      console.log(err);
    }
  };
  getAllRecipes();
});

router.get("/recipeDetail/:recipeId", async (req, res) => {
  let entityId = req.params.recipeId;
  console.log(
    `https://liveapi-sandbox.yext.com/v2/accounts/me/entities/${entityId}?api_key=${APP_API_KEY}&v=20220101`
  );
  try {
    const resp = await axios.get(
      `https://liveapi-sandbox.yext.com/v2/accounts/me/entities/${entityId}?api_key=${APP_API_KEY}&v=20220101`
    );

    const streamsResponse = await axios.get(
      `https://streams-sbx.yext.com/v2/accounts/me/api/recipesandrestaurants?api_key=${APP_API_KEY}&v=20200408&id=11103893`
    );

    const getReviews = await axios.get(
      `https://api-sandbox.yext.com/v2/accounts/me/reviews?api_key=${APP_API_KEY}&v=20220101&entityId=11104927`
    );
    const getQnA = await axios.get(
      `https://api-sandbox.yext.com/v2/accounts/me/questions?api_key=${APP_API_KEY}&v=20220101&entityId=11104927`
    );
    res.render("recipeDetail", {
      recipeData: resp.data.response,
      streamsData: streamsResponse.data.response.docs[0].c_availableAt,
      reviewData: getReviews.data.response.reviews,
      qnaData: getQnA.data.response.questions,
    });
  } catch (err) {
    console.log(err.response.data.meta.errors);
  }
});

router.get("/recipeList/:ingredient?", async (req, res) => {
  let ingredient = req.params.ingredient;
  let url;
  ingredient
    ? (url = `https://liveapi-sandbox.yext.com/v2/accounts/me/entities?limit=20&api_key=${APP_API_KEY}&v=20220104&filter={ 'c_ingredients':{ '$contains':"${ingredient}"}}`)
    : (url = `https://liveapi-sandbox.yext.com/v2/accounts/me/entities?limit=20&api_key=${APP_API_KEY}&v=20220104&entityTypes=ce_recipes`);
  try {
    const resp = await axios.get(url);
    res.render("recipeList", {
      title: ingredient
        ? `Found ${resp.data.response.entities.length} Recipes`
        : `Recipes List`,
      data: resp.data.response.entities,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/locationsList", async (req, res) => {
  let entityId = req.params.ingredient;
  try {
    const resp = await axios.get(
      `https://liveapi-sandbox.yext.com/v2/accounts/me/entities?limit=20&api_key=${APP_API_KEY}&v=20220104&entityTypes=restaurant`
    );
    res.render("locationsList", {
      data: resp.data.response.entities,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/locationDetail/:locationId", async (req, res) => {
  let entityId = req.params.locationId;
  try {
    const resp = await axios.get(
      `https://liveapi-sandbox.yext.com/v2/accounts/me/entities/${entityId}?api_key=${APP_API_KEY}&v=20220101`
    );
    res.render("locationDetail", {
      data: resp.data.response,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/autocomplete", (req, res) => {
  let searchString = req.query.term;
  core
    .verticalAutocomplete({
      verticalKey: "recipes",
      input: searchString,
    })
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
});

router.get("/search", async (req, res) => {
  const searchTerm = req.query;
  core
    .verticalSearch({
      verticalKey: "recipes",
      query: searchTerm.search,
    })
    .then((resp) => {
      res.render("searchResult", {
        title: `Found ${resp.verticalResults.results.length} Recipes`,
        data: resp.verticalResults.results,
      });
    });
});

router.post("/postReview", async (req, res) => {
  var body = req.body;
  var data = JSON.stringify({
    entity: {
      id: "11104927",
    },
    authorName: body.name,
    authorEmail: body.email,
    title: body.title,
    rating: parseInt(body.rate),
    content: body.textarea,
    status: "LIVE",
    reviewDate: `${new Date().getFullYear()}-${
      (m = new Date().getMonth() + 1) < 10 ? `0${m}` : `${m}`
    }-${(n = new Date().getDate()) < 10 ? `0${n}` : `${n}`}`,
  });
  var config = {
    method: "post",
    url: `https://liveapi-sandbox.yext.com/v2/accounts/me/reviewSubmission?api_key=${APP_API_KEY}&v=20220104`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  try {
    var resData = await axios(config);
    res.json({ success: "resData" });
  } catch (error) {
    if (error.response) {
      console.log(error.response.data.meta.errors);
    }
  }
});
router.post("/postQnA", async (req, res) => {
  var body = req.body;
  var data = JSON.stringify({
    entityId: "8286784854362976412",
    name: body.name,
    email: body.email,
    questionText: body.questionText,
    questionLanguage: "english",
  });
  var config = {
    method: "post",
    url: `https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion?api_key=${APP_API_KEY}&v=20220104`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  try {
    var resData = await axios(config);
    res.json({ success: "resData" });
  } catch (error) {
    if (error.response) {
      console.log(error.response.data.meta.errors);
    }
  }
});
router.get("/submitRecipe", async (req, res) => {
  res.render("submitRecipe", {});
});

router.post("/postRecipe", async (req, res) => {
  var body = req.body;
  var data = JSON.stringify({
    meta: {
      id: Array.from(Array(20), () =>
        Math.floor(Math.random() * 36).toString(36)
      ).join(""),
    },
    name: body.name,
    datePosted: new Date().toISOString().split("T")[0],
    c_ingredients: createArrayFromString(body.ingredients),
    c_images: createArrayFromString(body.images),
    c_preparationTime: body.preparationTime,
    c_serves: body.serves,
    c_aurthor: body.author,
    c_nutrition: createArrayFromString(body.nutrition),
    c_cuisine: createArrayFromString(body.cuisine),
    c_course: createArrayFromString(body.course),
    c_totalIngredients: createArrayFromString(body.totalIngredients),
    richTextDescription: body.description,
    c_instructions: createArrayFromString(body.instructions),
  });
  var config = {
    method: "post",
    url: `https://api-sandbox.yext.com/v2/accounts/me/entities?api_key=${APP_API_KEY}&v=20220101&entityType=ce_recipes&format=html`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    var resData = await axios(config);
    res.json({ success: "resData" });
  } catch (error) {
    if (error.response) {
      console.log(error.response.data.meta.errors);
    }
  }
});

router.post("/reviews_webhook", (req, res) => {
  req.io.emit("newReview", "newReview");
});

router.post("/qna_webhook", (req, res) => {
  req.io.emit("newQna", "newQna");
});

createArrayFromString = (data) => {
  var retArray = [];
  if (data.includes("\n")) {
    data.includes("\n")
      ? data.split("\n").forEach((item) => retArray.push(item.trim()))
      : retArray.push(data);
  } else {
    data.includes(",")
      ? data.split(",").forEach((item) => retArray.push(item.trim()))
      : retArray.push(data);
  }

  return retArray;
};

module.exports = router;
