const express = require('express')
const cors = require('cors');
const app = express()
const itemsroute = require("./routes/items.js")
const usersroute = require('./routes/users.js')

app.use(express.json())
app.use(cors())

app.use("/items", itemsroute)
app.use("/users", usersroute)

app.get('/', (req, res) => {
    res.send("Welcome to gummy")
})

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log("Running on port 5000")
})