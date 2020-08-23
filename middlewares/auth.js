const auth = (req, res, next) => {
    if (req.session.isAuth && req.session.isAuth === true)
        next();
    else res.sendStatus(401);
}

module.exports = auth;