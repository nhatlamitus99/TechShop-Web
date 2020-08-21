const auth = (req, res, next) => {
    if (!req.session.isAuth || req.session.isAuth === false)
        return res.sendStatus(401);
    next();
}

module.exports = auth;