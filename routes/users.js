const express = require('express')
const multer = require('multer');
const path = require('path')
const MongoClient = require('mongodb').MongoClient
const {v4 : uuidv4} = require('uuid')
const bcrypt = require('bcrypt')
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

// UTILITY FUNCTIONS 
const emailExists = async (email) => {
    let query = {email: email}
    const userCount = await db.collection('users').countDocuments(query)
    if (userCount === 0) {
        return false
    }
    return true
}

const authenticateUser = async (email, password) => {
    let query = {email: email}
    const options = {
        projection: { _id: 0, email: 1, password: 1, userId: 1 },
    };
    let checkEmail = await emailExists(email)
    if (checkEmail){
        const user = await db.collection('users').findOne(query, options)
        const verifyPass = await bcrypt.compare(password, user.password);
        if (verifyPass) {
            return {status: true, data: {userId: user.userId}}
        }
        else{
            return {status: false, data: null}
        }
    }
    return {status: false, data: null}
}

// REGISTER NEW USER
router.post('/register', async (req, res, next) => {
    let userDetails = req.body
    let hash = await bcrypt.hash(userDetails.password, 10)
    userDetails.password = hash
    userDetails.userId = uuidv4()
    let checkEmail = await emailExists(userDetails.email)
    if (checkEmail == false) {
        db.collection('users').insertOne(userDetails, (err, result) => {
            if (err) return next(err)
            res.send({status: 'ok', error: null, data: {msg: 'registration successful'}})
        }) 
    }  
    else{
        res.status(403).send({ status: 'error', error: 'email already exists', data: null })
    }
})

// LOGIN OLD USER
router.post('/login', async (req, res) => {
    let userDetails = req.body
    let userValid = await authenticateUser(userDetails.email, userDetails.password)
    if (userValid.status == true) {
        req.session.user = userValid.data.userId
        res.send({status: 'ok', error: null, data: {msg: 'login successful'}})
    }
    else{
        res.status(403).send({ status: 'error', error: 'Invalid login credentials', data: null })
    }
})

// CHECK IF USER IS LOGGED IN
router.post('/isloggedin', utils.isLoggedIn, (req, res) => {
    res.send({status: 'ok', error: null, data: {msg: 'logged in'}})
})

// GET USER'S DETAILS FROM DB
router.get('/getuserdetails',utils.isLoggedIn, async (req, res) => {
    let userId = req.session.user
    let query = {userId: userId}
    let options = {
        projection: {_id: 0, password: 0, student_number: 0, userId: 0, date_joined: 0, email_verified: 0, notifications: 0}
    }
    const itemsCount = await db.collection('users').countDocuments(query)
    if (itemsCount >= 1) {
        db.collection('users').findOne(query, options, (err, results) => {
            if (err) return next(err)
            res.send({status: 'ok', error: null, data:results})
        })
    }
})

// GET USER'S ITEM INVENTORY
router.get('/getinventory', utils.isLoggedIn, async (req, res, next)=>{
    let userId = req.session.user
    let query = {userId: userId}
    let options = {
        projection: {_id: 0, userId: 0}
    }
    db.collection('items').find(query, options).toArray((err, results) => {
        if (err) return next(err)
        res.send({status: 'ok', error: null, data:results})
    })
})

// UPLOAD PROFILE IMAGE
const imageStorage = multer.diskStorage({
    destination: 'profile_images',
    filename: (req, file, cb) => {
        if (req.query.filename == "") {
            cb(null, req.session.user + uuidv4() + path.extname(file.originalname))
        }
        else{
            cb(null, req.query.filename)
        }
    }
})

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

router.post('/uploadprofileimage', utils.isLoggedIn, imageUpload.single('user_image'), (req, res) => {
    const url = req.protocol + '://' + req.get('host')
    let filename = url + '/profile_images/' + req.file.filename
    res.send(filename)
}, (error, req, res, next) => {
    console.log(error)
    res.status(403).send({ status: 'error', error: error.message, data: null })
})


// UPDATE USER'S DETAILS IN DB
router.put('/updatedetails', utils.isLoggedIn, (req, res) => {
    let userDetails = req.body
    let new_value = {$set: userDetails}
    let query = {userId: req.session.user}
    let options = { safe: true, multi: false }
    db.collection('users').updateOne(query, new_value, options, (err, results) => {
        if(err) return next(err)
    })
    res.send({status: 'ok', error: null, data: {msg: 'user details updated successfully'}})
})

module.exports = router