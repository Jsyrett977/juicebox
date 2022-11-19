const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost } = require('../db');
const { requireUser } = require('./utils')

postsRouter.use((req, res, next) => {
    console.log('request to /posts')
    next();
})
postsRouter.get('/', async (req, res) => {
    const posts = await getAllPosts()
    res.send({
        posts
    })
})
postsRouter.post('/', requireUser, async (req, res, next) => {
    res.send({
        message: "under construction"
    })
})
postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = ""} = req.body;
    const tagArr = tags.trim().split(/\s+/)
    const postData = {}

    if(tagArr.length){
        postData.authorId = req.user.id
        postData.tags = tagArr;
        postData.content = content;
        const post = await createPost(postData);
        res.send({ post });
    }else{
        next({
            name: "NoPostCreated",
            message: "Post was not able to be created"
        })
    }
    try{
        postData.title = title;

    } catch({name, message}){
        next({name, message})
    }

})

module.exports = postsRouter;