require('dotenv').config()
const express = require("express");
const { client } = require('./db')
const app = express();
const apiRouter = require('./api')
const morgan = require("morgan");
app.use(morgan("dev"));
app.use(express.json());    
client.connect();

app.use((req, res, next) => {
    console.log("This is middleware running...");
    console.log('req.body,', req.body)
    next();
  });


app.use('/api', apiRouter);



const PORT = 3000;
app.listen(PORT, () => {
    console.log("Server is up and Running on port: ", PORT)
})