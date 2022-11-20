const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser, getUserById, updateUser } = require('../db');
const jwt = require('jsonwebtoken');
const {requireUser} = require('./utils')

usersRouter.use((req, res, next) => {
    console.log('request to /users')
    next();
})
usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers()
    res.send({
        users
    })
})
usersRouter.post('/login', async (req, res, next) => {
    const { username, password }  = req.body;

    if(!username || !password){
        next({
           name:  "MissingUsernameOrPassword",
            message: "Please give both a Username and Password"
        })
    }
    try{
        const user = await getUserByUsername(username);
        console.log(user)
        if(user && user.password === password){
            const token = jwt.sign({
                id: user.id,
                username: username
            }, process.env.JWT_SECRET);

            res.send({
                message: "You Have Logged In",
                token: token
            })
        }else{
            next({
                error: "IncorrectCredentials",
                message: 'Username or Password is incorrect'
            })
        }
    } catch(error){
        console.log(error);
        next(error)
    }
})
usersRouter.post('/register', async(req, res, next) => {
    const { username, password, name, location} = req.body;
    try{
        const _user = await getUserByUsername(username);
        if(_user){
            next({
                name: "UserEXists",
                message: "A user exists with that username"
            })
        }
        const user = await createUser({
            username,
            password,
            name,
            location,
        })
        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });
        res.send({
            message: 'Thank you for signing up',
            token
        })
    } catch({name, message}){
        next({name, message})
    }
} )

usersRouter.delete('/:userId', requireUser, async (req, res, next) =>{
    const userId = req.params.userId
    const user = await getUserById(userId)
    try{
        if(user.id === req.user.id){
            const updatedUser = await updateUser(user.id, {active: false})
            res.send({
                updatedUser
            })
        }else{
            next({
                name: "CouldNotDelete",
                message: "No Changes made"
            })
        }
    } catch({name, message}){
        next({name, message})
    }
})
module.exports = usersRouter;