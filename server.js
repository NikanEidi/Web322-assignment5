/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
*  of this assignment has been copied manually or electronically from any other source (including web sites) or
*  distributed to other students.
*
*  Name: Nikan Eidi Student ID: 154112239 Date: 4 March
*
*  Cyclic Web App URL: https://web322-assignment3-kb4x.onrender.com
*  GitHub Repository URL: https://github.com/NikanEidi/Web322-assignment4
********************************************************************************/

const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const storeService = require("./store_service");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: "dy8zztc6y",
  api_key: "912673362554462",
  api_secret: "EprXZFGCM9xDaqi6YS81HDMnaiY",
  secure: true,
});

const upload = multer();

const hbs = exphbs.create({
  extname: ".hbs",
  defaultLayout: "main",
  helpers: {
    navLink: function (url, options) {
      return (
        '<li class="nav-item"><a ' +
        (url == app.locals.activeRoute ? 'class="nav-link active"' : 'class="nav-link"') +
        ' href="' + url + '">' + options.fn(this) + '</a></li>'
      );
    },
    equal: function (lvalue, rvalue, options) {
      return lvalue == rvalue ? options.fn(this) : options.inverse(this);
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
});

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/items", (req, res) => {
  storeService.getAllItems()
    .then(data => {
      if (data.length > 0) {
        res.render("items", { items: data });
      } else {
        res.render("items", { message: "No results" });
      }
    })
    .catch(() => res.render("items", { message: "No results" }));
});

app.get("/categories", (req, res) => {
  storeService.getCategories()
    .then(data => {
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        res.render("categories", { message: "No results" });
      }
    })
    .catch(() => res.render("categories", { message: "No results" }));
});

app.get("/items/add", (req, res) => {
  storeService.getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch(() => {
      res.render("addItem", { categories: [] });
    });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
  let uploadedImageUrl = "";

  if (req.file) {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return res.status(500).send("Error uploading image.");
        }

        uploadedImageUrl = result.secure_url;

        const newItem = {
          title: req.body.title,
          body: req.body.body,
          featureImage: uploadedImageUrl,
          price: req.body.price,
          category: req.body.category,
          published: req.body.published === "on",
        };

        storeService.addItem(newItem)
          .then(() => res.redirect("/items"))
          .catch(() => res.status(500).send("Error adding item"));
      }
    ).end(req.file.buffer);
  }
});

app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Error adding category"));
});

app.get("/categories/delete/:id", (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Remove Category / Category not found)"));
});

app.get("/items/delete/:id", (req, res) => {
  storeService.deletePostById(req.params.id)
    .then(() => res.redirect("/items"))
    .catch(() => res.status(500).send("Unable to Remove Post / Post not found)"));
});

app.get("/shop", async (req, res) => {
  let viewData = {};
  try {
    let items = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();

    if (items.length === 0) {
      viewData.message = "No results for items";
    } else {
      items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
      viewData.items = items;
      viewData.item = items[0];
    }
  } catch {
    viewData.message = "No results for items";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories.length > 0 ? categories : [];
  } catch {
    viewData.categoriesMessage = "No categories found";
  }

  res.render("shop", { data: viewData });
});

app.get("/shop/:id", async (req, res) => {
  let viewData = {};

  try {
    let items = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();

    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
    viewData.items = items;
  } catch {
    viewData.message = "no results";
  }

  try {
    viewData.item = await storeService.getItemById(req.params.id);
  } catch {
    viewData.message = "no results";
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.use((req, res) => {
  res.status(404).render("404", { message: "Page Not Found" });
});

storeService.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express HTTP server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(`Failed to initialize data: ${err}`);
  });