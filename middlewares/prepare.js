const category = require('../models/Category');

const prepare = async (req, res, next) => {
    if (typeof(req.session.isAuth) === 'undefined') {
        req.session.isAuth = false;
    }
    res.locals.lcCategories = null;
    categories = await category.findAll({ attributes: ['id', 'name'] });
    if (categories) {
        res.locals.lcCategories = categories;
    }
    console.log(req.url);
    next();
};

module.exports = prepare;