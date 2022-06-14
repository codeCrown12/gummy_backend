const express = require('express')
const multer = require('multer')
const MongoClient = require('mongodb').MongoClient
const {v4 : uuidv4} = require('uuid')
const bcrypt = require('bcrypt');


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

const isLoggedIn = (req, res, next) => {
    if(req.session.user){
        console.log(req.session.user)
        next();
     } else {
        console.log(req.session.user)
        res.status(403).send({ status: 'error', error: 'not logged in', data: null })
     }
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
        console.log(req.session)
        res.send({status: 'ok', error: null, data: {msg: 'login successful'}})
    }
    else{
        res.status(403).send({ status: 'error', error: 'Invalid login credentials', data: null })
    }
})

// CHECK IF USER IS LOGGED IN
router.post('/isloggedin', isLoggedIn, (req, res) => {
    res.send({status: 'ok', error: null, data: {msg: 'logged in'}})
})


module.exports = router