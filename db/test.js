const jwt = require('jsonwebtoken')

const token = jwt.sign({id: 3, username: "joshua", }, 'server secret')

const data = jwt.verify(token, 'server secret')

