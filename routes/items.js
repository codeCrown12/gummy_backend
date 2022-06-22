const express = require('express')
const multer = require('multer');
const path = require('path')
const MongoClient = require('mongodb').MongoClient;
const {v4 : uuidv4} = require('uuid')
const utils = require('../utilities/utilityfuncs')

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
})

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload an image'), false)
        }
        cb(undefined, true)
    }
}) 

router.post('/uploadimages', utils.isLoggedIn, imageUpload.array('item_image', 6), (req, res) => {
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
router.post('/additem', utils.isLoggedIn, (req, res, next) => {
    let item = req.body
    item.userId = req.session.user 
    item.itemId = utils.generateItemId()
    db.collection('items').insertOne(item, (err, result) => {
        if (err) return next(err)
        res.send({status: 'ok', error: null, data: {msg: 'item added successfully'}})
    })
})

// Update item details in db
router.put('/updateitemdetails', utils.isLoggedIn, (req, res, next) => {
    let itemDetails = req.body
    let new_value = {$set: itemDetails}
    let query = {itemId: itemDetails.itemId}
    let options = { safe: true, multi: false }
    db.collection('items').updateOne(query, new_value, options, (err, results) => {
        if(err) return next(err)
    })
    res.send({status: 'ok', error: null, data: {msg: 'item details updated successfully'}})
})

// Delete item from db
router.delete('/deleteitem', utils.isLoggedIn, (req, res, next) => {
    let itemId = req.body.itemId
    let query = {itemId: itemId}
    db.collection('items').deleteOne(query, (err, results) => {
        if (err) return next(err)
    })
    res.send({status: 'ok', error: null, data: {msg: 'item removed successfully'}})
})

// select items from db
router.get('/getitems', (req, res) => {
    let options = {
        projection: {_id: 0, userId: 0, status: 0, date_added: 0, description: 0}
    }
    db.collection('items').find({}, options).toArray((err, results) => {
        if (err) return next(err)
        res.send({status: 'ok', error: null, data:results})
    })
})

router.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({status: 'error', error: err.message, data: null})
})

module.exports = router