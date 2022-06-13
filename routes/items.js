const express = require('express')
const multer = require('multer');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const {v4 : uuidv4} = require('uuid')

// MongoDB connection
const url = "mongodb+srv://dbschoolhero:uJkTKLFBLIHB06xE@testcluster.l7oe0.mongodb.net/gummy?retryWrites=true&w=majority";
let db
MongoClient.connect(url, (err, client) => {
    if (err){
        console.log(err)
    }
    db = client.db()
})

const router = express.Router()

// Upload item images
const imageStorage = multer.diskStorage({
    destination: 'item_images',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + '_' + Date.now() + path.extname(file.originalname))
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg)$/)) {
            return cb(new Error('Please upload a Image'))
        }
        cb(undefined, true)
    }
}) 

router.post('/uploadimages', imageUpload.array('item_image', 6), (req, res) => {
    let image_urls = []
    const url = req.protocol + '://' + req.get('host')
    for (var i = 0; i < req.files.length; i++) {
        image_urls.push(url + '/item_images/' + req.files[i].filename)
    }
    res.send(image_urls)
},(error, req, res, next) => {
    console.log(error)
    res.status(403).send({ status: 'error', error: error.message, data: null })
})


// Add item details to db
router.post('/additem', (req, res, next) => {
    let item = req.body
    db.collection('items').insertOne(item, (err, result) => {
        if (err) return next(err)
        res.send({status: 'ok', error: null, data: {msg: 'item added successfully'}})
    })
})

router.use((err, req, res) => {
    console.log(err.stack)
    res.status(403)
    res.send({status: 'ok', error: err.message, data: null})
})

module.exports = router