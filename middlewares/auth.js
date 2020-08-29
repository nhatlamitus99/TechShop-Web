const auth = (req, res, next) => {
    if (req.session.isAuth && req.session.isAuth === true)
        next();
    else {
        res.redirect('/login');
    }
}

module.exports = auth;