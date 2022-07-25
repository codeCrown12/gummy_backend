const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const MongoStore = require('connect-mongo')
const session = require('express-session')
const app = express()
const itemsroute = require("./routes/items.js")
const usersroute = require('./routes/users.js')
const url = "mongodb+srv://dbschoolhero:uJkTKLFBLIHB06xE@testcluster.l7oe0.mongodb.net/gummy?retryWrites=true&w=majority";


app.use(express.json())
app.use(cors({
    origin: 'https://gummy23.netlify.app',
    credentials: true
}))
app.set('trust proxy', 1)
app.use(session({
    store: MongoStore.create({mongoUrl: url}),
    secret: '89050a617a0741cb3d34a87f48f97b2e',
    resave: true,
    saveUninitialized: false,
    cookie: { secure: 'auto', maxAge: 4 * 60 * 60 * 1000 }
}))

app.use("/items", itemsroute)
app.use("/users", usersroute)

app.use(function(req, res, next){
    var filePath = path.join(__dirname, req.path)
    fs.stat(filePath, function(err, fileInfo){
        if (err) {
            next()
            return
        }
        if (fileInfo.isFile()) {
            res.sendFile(filePath)
        }
        else{
            next()
        }
    })
})

app.delete('/remove_files', (req, res, next) => {
    let img_urls = req.body
    img_urls.forEach(img => {
        let img_path = path.join(__dirname, img.substring(22))
        fs.unlink(img_path, (err) => {
            if (err) return next(err)
        })
    });
    res.send({status: 'ok', error: null, data: {msg: 'image(s) removed successfully'}})
})

app.get('/', (req, res) => {
    res.send("Welcome to gummy")
})

app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500).send({status: 'error', error: err.message, data: null})
})

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log("Running on port 5000")
})