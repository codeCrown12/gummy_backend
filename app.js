const express = require('express')
const cors = require('cors');
const app = express()
const itemsroute = require("./routes/items.js")
const usersroute = require('./routes/users.js')
const session = require('express-session');

app.use(express.json())
app.use(cors({
    credentials: true
}))
app.use(session({
    secret: '89050a617a0741cb3d34a87f48f97b2e',
    resave: true,
    saveUninitialized: true,
    cookie: { }
}))

app.use("/items", itemsroute)
app.use("/users", usersroute)

app.get('/', (req, res) => {
    res.send("Welcome to gummy")
})

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log("Running on port 5000")
})