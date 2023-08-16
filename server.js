/*********************************************************************************
 *  WEB322 – Assignment 6
 *  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 * 
 *  Name:  PURU AHALAWAT __ Student ID:  170440218___ Date: 13 AUG 2023
 *
 *  Cyclic Web App URL:https://lazy-lime-indri-fez.cyclic.app/posts/add
 *
 *  GitHub Repository URL: https://github.com/puruahalawat/WORK-COLLEGE/tree/main
 *
 ********************************************************************************/

 var express = require('express')
var data = require('./blog-service')
var authData = require('./auth-service')
var app = express()
var path = require("path");
const exphbs = require('express-handlebars');
const fs = require('fs');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const bodyparser = require('body-parser');
app.use(express.static('public'))
app.use(bodyparser.json());
const stripJs = require('strip-js');
const clientSessions = require("client-sessions");

var PORT = process.env.PORT || 8080

app.use(express.urlencoded({ extended: true }));



cloudinary.config({
    cloud_name: 'dflilinky',
    api_key: '728615774425672',
    api_secret: 'oZ9jOS81mEfxoYGHK8GlLezC2Iw',
    secure: true
});


const upload = multer();

app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',

    helpers: {
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        safeHTML: function(context) {
            return stripJs(context);

        },

        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        formatDate: (dateObj) => {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

    }
}));


app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});


app.set('view engine', '.hbs');

// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {

    res.redirect("/blog");
});

// Login

app.get("/login", (req, res) => {
    res.render("login");
});

// Register

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }))
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/posts');
    }).catch((err) => {
        res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

// Logout

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// Get User History

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});




app.get("/about", (req, res) => {
    res.render(path.join(__dirname + "/views/about.hbs"));
});


app.get('/blog', async(req, res) => {
    var viewData = { post: {}, posts: [] };
    try {
        let posts = [];
        if (req.query.category) {
            posts = await data.getPostsByCategory(req.query.category);
        } else {
            posts = await data.getallPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        let post = posts[0];
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await data.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    console.log(viewData.post);
    res.render("blog", { data: viewData })
});

app.get('/blog/:id', async(req, res) => { 
    var viewData = { post: {}, posts: [] };
    try {
        let posts = [];
        if (req.query.category) {
            posts = await data.getPublishedPostsByCategory(req.query.category);
        } else {
            posts = await data.getPublishedPosts();
        }
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.posts = posts;
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        viewData.post = await data.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }
    try {
        let categories = await data.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }
    res.render("blog", { data: viewData })
});

app.get("/posts", ensureLogin, (req, res) => {
    let category = req.query.category;
    let minDate = req.query.minDate;
    if (category) {
        data.getPostsByCategory(category).then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    } else if (minDate != "" && minDate != null) {
        data.getPostsByMinDate(minDate).then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    } else {
        data.getallPosts().then(data => {
            if (data.length > 0) {
                res.render("posts", { posts: data });
            } else {
                res.render("posts", { message: "no results" });
            }
        })
    }
});

app.get('/posts/add', ensureLogin, (req, res) => {

    data.getCategories()
        .then(data => res.render("addPost", { categories: data }))
        .catch(err => {
            res.render("addPost", { categories: [] })
            console.log(err);
        });
});

// post/value route 
app.get('/posts/:id', ensureLogin, (req, res) => {
    data.getPostById(req.params.id).then((data) => {
        res.send(data);
    }).catch((err) => {
        res.send("No Result Found");
    })
});

app.post('/posts/add', ensureLogin, upload.single('featureImage'), (req, res) => {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }
    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url;
        var postData = req.body;
        data.addPost(postData).then(data => {
            res.redirect('/posts');
        }).catch(err => {
            res.send(err);
        });

    });

});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    data.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/posts");
        }).catch(err => {
            res.status(500).send("Unable to Remove Post / Post not found");
            console.log(err);
        });
});

app.get("/categories", ensureLogin, (req, res) => {
    data.getCategories().then(data => {
        if (data.length > 0) {
            res.render("categories", { categories: data });
        } else {
            res.render("categories", { message: "no results" });
        }
    })
});

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render(path.join(__dirname, "/views/addCategory.hbs"));
});


app.post("/categories/add", ensureLogin, (req, res) => {
    data.addCategory(req.body).then(() => {
        res.redirect("/categories");
    })
});



app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    data.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        }).catch(err => {
            res.status(500).send("Unable to Remove Category / Category not found");
            console.log(err);
        });
});

app.use(function(req, res, next) {
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render(path.join(__dirname + "/views/pageNotFound.hbs"));
        return;
    }
});

// setup http server to listen on HTTP_PORTs
// initilize the App 
data.initialize()
    .then(authData.initialize)
    .then(function() {
        app.listen(PORT, function() {
            console.log("app listening on: " + PORT)
        });
    }).catch(function(err) {
        console.log("unable to start server: " + err);
    });