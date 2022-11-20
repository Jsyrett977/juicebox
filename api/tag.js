const express = require('express');
const tagsRouter = express.Router();
const {getPostsByTagName, getAllTags} = require('../db')

tagsRouter.use((req, res, next) => {
    console.log('request to /tags')
    next();
})
tagsRouter.get('/', async (req, res, next) => {
    tags = await getAllTags();
    res.send({
        tags
})
})
tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const {tagName} = req.params;
    try{
     const post = await getPostsByTagName(tagName)
     res.send({
        post
     })
        next()
    } catch({name, message}){
        next({name, message})
    }
})

module.exports = tagsRouter;