const express = require('express');
const apiRouter = express.Router();
const usersRouter = require('./users')
const postsRouter = require('./post')
const jwt = require("jsonwebtoken");
const { getUserById } = require('../db')
const { JWT_SECRET } = process.env

apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization')

    if(auth){
        const [_, token] = auth.split(' ');
        const data = jwt.verify(token, JWT_SECRET)
        const user = await getUserById(data.id);
        req.user = user;
        next();
    }else if (!auth){
        next()
    }else{
        next({
            error: "Auth Header Error",
            message: 'Token must start with Bearer'
        })
    }
})





apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter)



apiRouter.use((error, req, res, next) => {
    res.send({
        name: error.name,
        message: error.message
    })
})
module.exports = apiRouter;