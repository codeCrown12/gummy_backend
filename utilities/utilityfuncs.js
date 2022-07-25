const isLoggedIn = (req, res, next) => {
    if(req.session.user){
        next();
     } else {
        res.status(403).send({ status: 'error', error: `not logged in ${req.session.user}`, data: null })
     }
}

const generateId = (length = 8) => {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

module.exports = { isLoggedIn, generateId }