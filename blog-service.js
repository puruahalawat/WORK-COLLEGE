const fs = require('fs');
const { builtinModules } = require('module');

global.postsArray = [];
global.categoriesArray = [];



module.exports.initialize = function() {
    return new Promise(async(resolve, reject) => {
        const dataBuffer = fs.readFileSync('./data/posts.json');
        if (dataBuffer.length > 0) {
            postsArray = JSON.parse(dataBuffer);
            const dataCategories = fs.readFileSync('./data/categories.json');
            if (dataCategories.length > 0) {
                categoriesArray = JSON.parse(dataCategories);
            } else {
                reject("can't read categories.json");
            }

            resolve("success");
        } else {
            reject("can not read file");
        }
    })
}


module.exports.getallPosts = function() {
    return new Promise(async(resolve, reject) => {
        if (postsArray.length > 0) {
            resolve(postsArray);
        } else {
            reject("no results returned");
        }
    })
}

module.exports.getPublishedPosts = function() {
    return new Promise(async(resolve, reject) => {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => a.published == true);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }
    })
}

module.exports.getPublishedPostsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        (postsArray.length > 0) ? resolve(postsArray.filter(post => postsArray.published == true && postsArray.category == category)): reject('no results returned');
    });
}


module.exports.getCategories = function() {
    return new Promise(async(resolve, reject) => {
        if (categoriesArray.length > 0) {
            resolve(categoriesArray);
        } else {
            reject("no results returned");
        }
    })
}

module.exports.addPost = function(postData) {
    return new Promise(async(resolve, reject) => {
        if (postData.published == undefined) {
            postData.published = false;
        } else {
            postData.published = true;
        }

        postData.postDate = new Date();
        postData.id = postsArray.length + 1;
        postsArray.push(postData);
        resolve(postData);
        reject("error");


    })
}

// getPostsByCategory Route

module.exports.getPostsByCategory = (category) => {
    return new Promise(function(resolve, reject) {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => a.category == category);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }
    });
};

// getPostsByMinDate Route

module.exports.getPostsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => new Date(a.postDate) >= new Date(minDateStr));
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }

    });
}

// getPostsByID Route

module.exports.getPostById = (id) => {
    return new Promise((resolve, reject) => {
        const df = fs.readFileSync('./data/posts.json');
        var publishedPosts = JSON.parse(df);
        var filtered = publishedPosts.filter(a => a.id == id);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }

    });
}

module.exports.getPublishedPostsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        var filtered = postsArray.filter(post => post.published == true && post.category == category);
        if (filtered.length > 0) {
            resolve(filtered);
        } else {
            reject("no results returned");
        }
    });
}