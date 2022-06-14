const express = require('express')
const cors = require('cors');
const app = express()
const itemsroute = require("./routes/items.js")
const usersroute = require('./routes/users.js')
const session = require('express-session');
const MongoStore = require('connect-mongo')
const url = "mongodb+srv://dbschoolhero:uJkTKLFBLIHB06xE@testcluster.l7oe0.mongodb.net/gummy?retryWrites=true&w=majority";

app.use(express.json())
app.use(cors({
    credentials: true
}))
app.set('trust proxy', 1)
app.use(session({
    store: MongoStore.create({mongoUrl: url}),
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