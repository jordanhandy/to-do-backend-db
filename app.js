const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.set('useFindAndModify', false);
let port = 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Connect Mongoose
// Remove deprecation warnings
mongoose.connect("mongodb+srv://admin-jordan:pWbok9PEqWSpDre8@todolistcluster-zynix.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true
});
// Create db item Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});
// Mongoose  item Model
const Item = mongoose.model("Item", itemsSchema);

// Static items in every list
const item1 = new Item({
  name: "Welcome to your ToDoList"
});
const item2 = new Item({
  name: "Press the + button to add a new item"
});
const item3 = new Item({
  name: "<--- Click here to mark an item complete"
});

// Array of default items
const defaultItems = [item1, item2, item3];

// Create db list Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
// Mongoose List Model
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err, results) {
    //If array is empty, add default items
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("oops");
        } else {
          console.log("items added Successfully");
        }
      });
      // Else just redirect back home to render page
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });
    }
  });
});

// for Post, create new item const from page value
app.post("/", function(req, res) {

  const item = new Item({
    name: req.body.newItem
  });
  // Create new list const from page value
  const list = req.body.list
  // If list is default, then just save item
  if (list === "Today") {
    item.save();
    // Redirect home
    res.redirect("/")
  }
  // If list is not default, then search for list in DB
  else {
    List.findOne({
      name: list
    }, function(err, foundList) {
      // If list is found, push new item to [item] array (schema definition)
      foundList.items.push(item);
      // Save the list
      foundList.save();
      // Redirect back home
      res.redirect("/" + list);
    });
  }
});

// To delete, find the item to delete by ID
// ID is pulled from item checkbox
app.post("/delete", function(req, res) {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkBox;
// If list is the default list, delete the item that is checked, and redirect back home
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Cannot delete");
        res.redirect("/");
      }
    });
    // Else find a list using the List Schema
    // Pull items from the item array, based on the found item id
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
      // If no errors found, redirect to new list page
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

// When rendering custom list page
app.get("/:listTitle", function(req, res) {
  // Get list title
  // Lodash to keep case uniform so that variances in sub-path searching remains the same
  const customListTitle = _.capitalize(req.params.listTitle);
  // If list exists. remder the list, and the standard array of default items
  List.findOne({
    name: customListTitle
  }, function(err, lists) {
    if (!err) {
      // If custom list is not found, make a new one
      if (!lists) {
        // Create a mew list
        const list = new List({
          name: customListTitle,
          items: defaultItems
        });
        // Save the list, and redirect back to the main list page to show new list
        list.save();
        res.redirect("/" + customListTitle);
      } else {
        // Show existing listTitle
        res.render("list", {
          listTitle: customListTitle,
          newListItems: lists.items
        });
      }
    }
  });
});

// About page
app.get("/about", function(req, res) {
  res.render("about");
});

// Server start logging
app.listen(process.env.PORT || port, function() {
  console.log("Server started on port " + port);
});
