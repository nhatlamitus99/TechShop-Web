const app = require('express');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const router = app.Router();
const upload = multer({ dest: './uploads/' });
const passport = require('passport');
const path = require('path');
const jwt = require('jsonwebtoken');
const authenticateUser = require('./middlewares/auth');

const HASH_KEY_SYNC = 10;
const PRODUCTS_PER_PAGE = 12;
const MAX_PRICE = 999999999;

const sequelize = require('sequelize');
var user = require('./models/User');
var product = require('./models/Product');
var brand = require('./models/Brand');
var category = require('./models/Category');
var order = require('./models/Order');
var store = require('./models/Storage');
var like = require('./models/Like');
var cart = require('./models/Cart');
var billdt = require('./models/Billdetail');
const { access } = require('fs');


var urlencodedParser = bodyParser.urlencoded({ extended: false });

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/upload/images');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
   
var uploadFile = multer({ storage: storage });

var UpdateQueryString = (key, value, url) => {
    if (!url) url = window.location.href;
    var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
        hash;

    if (re.test(url)) {
        if (typeof value !== 'undefined' && value !== null) {
            return url.replace(re, '$1' + key + "=" + value + '$2$3');
        }
        else {
            hash = url.split('#');
            url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
            if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
                url += '#' + hash[1];
            }
            return url;
        }
    }
    else {
        if (typeof value !== 'undefined' && value !== null) {
            var separator = url.indexOf('?') !== -1 ? '&' : '?';
            hash = url.split('#');
            url = hash[0] + separator + key + '=' + value;
            if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
                url += '#' + hash[1];
            }
            return url;
        }
        else {
            return url;
        }
    }
}


/////////////////////////////////////////////////    FOR GUEST AND NORMAL USER    ///////////////////////////////////////////////////////

//===================================== LOGIN, LOG OUT & REGISTER ============================================//

// render type: 1 = login, type: 2 = register, type: 0 = do nothing
router.get('/login', (req, res) => {
    res.render('user/login', { type: 0, message: '', field: -1});
});

router.post('/login', urlencodedParser, async (req, res) => {
    var _email = req.body.email.trim();
    var _password = req.body.password;

    await user.findOne({
        where: {
            email: _email
        }
    }).then( async (result) => {
        if (result) {
            if (bcrypt.compareSync(_password, result.password)) {
                // Session based authentication
                req.session.isAuth = true;
                req.session.userID = result.id;
                req.session.role = result.role;

                // Token based authentication
                var payload = { id: result.id, role: result.role };
                var accessToken = jwt.sign(payload, 'secret');
                
                if (result.role === 0) {
                    var likeIDs = await like.findAll({ where: { userID: result.id } });
                    likeProductIDs = [];
                    if (likeIDs) {
                        likeIDs.forEach(element => {
                            likeProductIDs.push(element.productID);
                        });
                    }
                    res.render('user/saveToken', { token: accessToken, name: result.fullname, likeProductIDs: likeProductIDs });
                } else {
                    res.render('manager/saveToken', { token: accessToken, user: result.username });
                }                    
            }
            else
                res.render('user/login', { type: 1, message: 'Mật khẩu không chính xác', field: 1 });
        }
        else {
            res.render('user/login', { type: 1, message: 'Email không chính xác', field: 0 });
        }
    })
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        });
});

router.get('/logout', authenticateUser, (req, res) => {
    req.session.isAuth = false;
    req.session.userID = null;
    req.session.role = null;
    res.redirect('/');
});

router.post('/register', urlencodedParser, (req, res) => {
    var _username = req.body.username
    var _email = req.body.email_register
    var _phone = req.body.phone
    var _password = req.body.password_register
    var _address = req.body.address
    var _fullname = req.body.fullname;

    user.findOne({
        where: {
            email: _email
        }
    }).then(result => {
        if (result)
            res.render('user/login', { type: 2, message: 'Email đã tồn tại', field: 2 });
        else {
            var hash = bcrypt.hashSync(_password, HASH_KEY_SYNC);
            user.create({
                fullname: _fullname,
                username: _username,
                email: _email,
                phone: _phone,
                password: hash,
                role: 0,
                address: _address
            })
            res.redirect('/login');
        }
    })
        .catch(err => {
            console.log(err)
            res.redirect('/login');
        });
});

// Register via Facebook
router.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    }
);

// Register via Google
router.get('/auth/google',  passport.authenticate('google', { scope: ['email']}));
router.get('/auth/google/callback',
    passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    }
);


//===================================== HOME PAGE ============================================//

router.get('/', async (req, res) => {
    var topPromo = await product.findAll({
        order: [['promo', 'DESC']],
        limit: 4
    });
    var topSold = await product.findAll({
        order: [['number_sell', 'DESC']],
        limit: 4
    });
    var _idLaptopCategory = 0;
    await category.findOne({
        where: {
            name: "Laptop"
        }
    }).then(result => _idLaptopCategory = result.id);

    var _idManHinhCategory = 0;
    await category.findOne({
        where: {
            name: "Màn hình"
        }
    }).then(result => _idManHinhCategory = result.id);

    var topSoldLaptop = await product.findAll({
        where: {categoryID: _idLaptopCategory},
        order: [['number_sell', 'DESC']],
        limit: 8
    });
    var topSoldManHinh = await product.findAll({
        where: {categoryID: _idManHinhCategory},
        order: [['number_sell', 'DESC']],
        limit: 8
    });
    if (topSoldLaptop.length < 8) {
        topSoldLaptop = null;
    }
    if (topSoldManHinh.length < 8) {
        topSoldManHinh = null;
    }
    res.render('user/index', {topPromo: topPromo, topSold: topSold, topSoldLaptop: topSoldLaptop, topSoldManHinh: topSoldManHinh});
});


//===================================== 404 NOT FOUND PAGE ============================================//

router.get('/404', (req, res) => {
    res.render('user/404.ejs');
});


//===================================== SEARCH FOR PRODUCT ============================================//

router.get('/search', (req, res) => {
    var query = req.query.q;
    console.log(query);
    // res.sendStatus(200);
    res.redirect('/');
});


//===================================== USER ACCOUNT PAGE ============================================//

// tab = 0: account infor, tab = 1: order management, tab = 2: wishlist, tab = 3: payment infor
router.get('/account/:tab', authenticateUser, (req, res) => {
    var tab = parseInt(req.params.tab);
    res.render('user/account', { tabID: tab });
});


//===================================== POLICY PAGE ============================================//

router.get('/policy', (req, res) => {
    res.render('user/policy')
});


//===================================== SINGLE PRODUCT DETAIL PAGE ============================================//

router.get('/product/:id', async (req, res) => {
    var _id = parseInt(req.params.id);
    var data = await product.findByPk(_id);
    var dataProduct = data;
    var similarProducts = null;
    if (data) {
        var row_category = await category.findByPk(data.categoryID);
        var row_brand = await brand.findByPk(data.brandID);
        dataProduct['brand'] = row_brand.name;
        dataProduct['category'] = row_category.name;

        // IMPROVE BY AI IN FUTURE
        similarProducts = await product.findAll({
            order: [['number_sell', 'DESC']],
            where: {
                id: {[sequelize.Op.not]: _id},
                brandID: data.brandID
            },
            limit: 4
        });
    }
    res.render('user/product', { 'dataProduct': dataProduct , 'similarProducts': similarProducts});
});


//===================================== CATEGORY PRODUCTS PAGE ============================================//

router.get('/category/:id', async (req, res) => {
    if (isNaN(req.params.id)) {
        res.redirect('/404');
    }
    var _id = parseInt(req.params.id);

    res.locals.UpdateQueryString = UpdateQueryString;
    res.locals.url = req.url;

    // get category name from categoryID
    var row_category = await category.findByPk(_id);
    var categoryName = "Danh mục";
    if (row_category) {
        categoryName = row_category.name;
    }
    // get all brand for filter
    var brands = await brand.findAll();

    /* 
    req.query can contain: 
        + page: page index - from 1 (show limit PRODUCTS_PER_PAGE)
        + sortBy: 0 = name from A-Z
                  1 = name from Z-A
                  2 = price asc
                  3 = price desc
                  4 = newest first
                  5 = oldest first 
        + brand: filter by brandID 
        + minPrice: filter by min price
        + maxPrice: filter by max price 
    */

    // for pagination
    var page = 1;
    if (req.query.page && /^\d+$/.test(req.query.page)) {
        page = parseInt(req.query.page);
        if (page < 1) {
            res.redirect('/category/' + _id + '?page=1');
        }
    } else {
        res.redirect('/category/' + _id + '?page=1');
    }
    // for sorting
    const mapSort = [['name', 'ASC'], ['name', 'DESC'], ['price', 'ASC'], ['price', 'DESC'], ['createdAt', 'DESC'], ['createdAt', 'ASC']];
    var sortBy = 0;
    if (req.query.sortBy && /^\d+$/.test(req.query.sortBy)) {
        let n = parseInt(req.query.sortBy);
        if (n >= 0 && n < 6) {
            sortBy = n;
        }
    }
    res.locals.sortBy = sortBy;
    // for filtering
    const _filter = {};
    _filter['categoryID'] = _id;
    var res_brand = [null, null];
    if (req.query.brand && /^\d+$/.test(req.query.brand)) {
        let n = parseInt(req.query.brand);
        if (n > 0) {
            _filter['brandID'] = n;
            res_brand[0] = n;
            await brand.findByPk(n).then(res => res_brand[1] = res.name);
        }
    }
    var minPrice = 0, maxPrice = MAX_PRICE;
    if (req.query.minPrice && /^\d+$/.test(req.query.minPrice)) {
        let n = parseInt(req.query.minPrice);
        if (n > 0) {
            minPrice = n;
        }
    }
    if (req.query.maxPrice && /^\d+$/.test(req.query.maxPrice)) {
        let n = parseInt(req.query.maxPrice);
        if (n > minPrice) {
            maxPrice = n;
        }
    }
    _filter['price'] = { [sequelize.Op.between]: [minPrice, maxPrice] };    

    // count all products with following condition
    var len = await product.count({
        where: _filter
    });
    len = len || 0;
    // if no product found, response null data
    if (len === 0) {
        res.render('user/category', {
            'dataProducts': null,
            'categoryName': categoryName,
            'categoryID': _id,
            'nofProducts': len,
            'brands': brands,
            'res_minPrice': minPrice,
            'res_maxPrice': maxPrice,
            'res_brandFilter': res_brand
        });
        return;
    }
    // calculate index of last page
    var lastPage = Math.ceil(len / PRODUCTS_PER_PAGE);
    if (page > lastPage) {
        res.redirect('/category/' + _id + '?page=' + lastPage);
    }
    var dataProducts = await product.findAndCountAll({
        order: [mapSort[sortBy]],
        where: _filter,
        limit: 12,
        offset: (page - 1) * PRODUCTS_PER_PAGE
    });

    res.render('user/category', {
        'dataProducts': dataProducts.rows,
        'categoryName': categoryName,
        'page': page,
        'categoryID': _id,
        'nofProducts': len,
        'lastPage': lastPage,
        'brands': brands,
        'res_minPrice': minPrice,
        'res_maxPrice': maxPrice,
        'res_brandFilter': res_brand
    });
});




// leave untouch yet
router.get('/user/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role !== 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(results=>{
        res.render('user/order', {'data': results})
    })
    .catch(err=> console.log(err))        
})

router.post('/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    product.findOne({
        where:{
            name: req.body.name
        }
    })
    .then(result=>{
        if(result){
            var _productID = result.id
            if(req.body.number>result.number)
                res.render('user/order', {'message': 'Not enough product in storage'})
            else{
                order.create({
                    userID: req.user.dataValues.id,
                    date: new Date(),
                    productID: _productID,
                    number: req.body.number,
                    status: "new"
                })
                .then(result1=>{
                    if(result1){
                        product.findOne({
                            where:{
                                id: _productID
                            }
                        })
                        .then(product=>{
                            num = product.number
                            num_sell = product.number_sell
                            product.update({
                                number: num-req.body.number,
                                number_sell: parseInt(num_sell)+parseInt(req.body.number)
                            }, {
                                where:{
                                    id: _productID
                                }
                            })
                            .then(result2=>{
                                res.render('user/order')
                            })
                            .catch(err=> console.log(err))
                        })         
                    }
                })
                .catch(err=> console.log(err))
            }      
        }
    })
    .catch(err=> console.log(err))
})

router.get('/like',passport.authenticate('jwt', { session: false }), (req, res)=>{
    like.findOne({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
    .catch(err=> console.log(err))
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////     FOR MANAGER AND ADMIN     /////////////////////////////////////////////

// USER API

router.get('/api/user', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.user.dataValues.role !== 2) {
        return res.sendStatus(403);
    }

    user.findAll({
        where:{
            role: { [Op.or]: [0, 1] }
        }
    })
    .then(result=>{
        res.status(200).json({'data': result})
    })
    .catch(err=> console.log(err))
})

router.get('/api/user/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role !== 2) {
        return res.sendStatus(403);
    }
    user.findAll({
        where:{
            role: { [Op.or]: [0, 1] },
            id: req.params.id
        }
    })
    .then(result=>{
        res.status(200).json({'data': result})
    })
    .catch(err=> console.log(err))
})

// CHECKOUT route & api

router.get('/checkout', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role !== 0) {
        return res.sendStatus(403);
    }
    user.findOne({
        where:{
            id: req.user.dataValues.id
        }
    })
    .then(result=>{
        if(result){
            res.render('user/checkout', {'data': result})
        }
    })
    .catch(err=> console.log(err))
})

router.post('/checkout', passport.authenticate('jwt', { session: false }), (req, res)=>{   
    if (req.user.dataValues.role !== 0) {
        return res.sendStatus(403);
    }
    user.update({
        fullname: req.body.fullname,
        phone: req.body.phone,
        address: req.body.address
    }, {
        where:{
            id: req.user.dataValues.id
        }
    })
    .then(result1=> {
        user.findOne({
            where:{
                id: req.user.dataValues.id
            }
        })
        .then(result2=>{
            res.render('user/order',{'data': result2})
        })
        .catch(err=> console.log(err))
    })
    .catch(err=> console.log(err))
    
})


// PURCHASE route

router.get('/purchase', (req, res)=>{
    res.render('user/purchase')
})


// PRODUCT route & api

router.get('/product', (req, res) => {
    if (req.user.dataValues.role !== 0) {
        return res.sendStatus(403);
    }
    product.findAll()
        .then(results => {
            res.render('user/product', { 'data': results })
        })
        .catch(err => console.log(err))
});


router.get('/api/product', (req, res)=>{
    product.findAll()
    .then(results =>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/api/product/:id', (req, res)=>{ 
    var _id = req.params.id 
    product.findOne({
        where:{
            id: _id
        }
    }).then(result=>{
        res.json({'data': result})
    }).catch(err=> console.log(err)) 
})

router.post('/product', uploadFile.single('file'),passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    var _name = req.body.name
    var _brand = req.body.brand_name
    var _info = req.body.info
    var _price = req.body.price
    var _category = req.body.category
    var _position = req.body.position

    if(!req.file)
        res.json({'message': 'Empty image'})
	
	
	
    brand.findOne({
        where:{
            name: _brand
        }
    }).then(result1=>{
        if(result1){
            _brandID = result1.dataValues.id
            category.findOne({
                where:{
                    name: _category
                }
            }).then(result2=>{
                if(result2){
                    _categoryID = result2.dataValues.id
                    store.findOne({
                        where:{
                            position: _position
                        }
                    }).then(result3=>{
                        _storageID = result3.dataValues.id
                        product.create({
                            name: _name,
                            brandID : _brandID,
                            rating: 0,
                            price: _price,
                            info: _info,
                            detail: req.body.detail,
                            image: req.file.destination+"/"+req.file.filename,
                            categoryID: _categoryID,
                            storageID: _storageID,
                            number: req.body.number,
                            number_sell: 0
                        })
                    })
                }     
            }).catch(err=>console.log(err))
        }
    }).catch(err=>console.log(err))
    res.render('manager/product')
})

router.put('/product/:id', uploadFile.single('file'), passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    
    product.update({
        name: req.body.name,
        rating: req.body.rating,
        price: req.body.price,
        info: req.body.info,
        detail: req.body.detail,
        number: req.body.number
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.render('manager/product')
    })
    .catch(err=> console.log(err))
})

router.delete('/product/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    product.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result1=>{
        if(result1){
            product.destroy({
                where:{
                    id: req.params.id
                }
            })
            .then(result2=>{
                res.render('manager/product')
            })
        }
        else{
            res.render('manager/product')
        }
    })
    
})


// BRAND route & api

router.post('/brand', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    var _name = req.body.name
    brand.findOne({
        where:{
            name: _name
        }
    }).then(result =>{ 
        if(!result){
            brand.create({
                name: _name
            })
        }
    })
    .catch(err=> {
        console.log(err)
    })
    res.render('manager/wellcome')
})

router.get('/api/brand', (req, res)=>{
    brand.findAll()
    .then(result=>{
        res.status(200).json({'data': result})
    })
})

router.get('/api/brand/:id', (req, res)=>{
    brand.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.status(200).json({'data': result})
    })
})

router.put('/brand/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    brand.update({
        name: req.body.name
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
})

router.delete('/brand/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    brand.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        if(result){
            brand.destroy({
                where:{
                    id: req.params.id
                }
            })
        }
    })
    res.json({'data': result})
})


// CATEGORY route & api

router.post('/category', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    var _name = req.body.name
    category.findOne({
        where:{
            name: _name
        }
    }).then(result =>{ 
        if(!result){
            category.create({
                name: _name
            })
        }
    })
    .catch(err=> {
        console.log(err)
    })
    res.render('manager/wellcome')
})

router.get('/api/category', (req, res)=>{
    category.findAll()
    .then(result=>{
        res.status(200).json({'data': result})
    })
})

router.get('/api/category/:id', (req, res)=>{
    category.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.status(200).json({'data': result})
    })
})

router.put('/category/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    category.update({
        name: req.body.name
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
})

router.delete('/category/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    category.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        if(result){
            category.destroy({
                where:{
                    id: req.params.id
                }
            })           
        }
        res.json({'data': result})
    })
    .catch(err=> console.log(err))
})



// CART route & api

router.post('/cart', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.user.dataValues.role !== 0) {
        return res.sendStatus(403);
    }
    
    if (!req.body.productID)
        res.json({ 'message': 'Empty product' })

    if (!req.body.number)
        res.json({ 'message': 'Empty number of items' })

    cart.create({
        userID: req.user.dataValues.id,
        productID: req.body.productID,
        number: req.body.number
    })
        .then(result => {
            res.json({ 'data': result })
        })
});

router.get('/api/cart', passport.authenticate('jwt', { session: false }), (req, res)=>{
    
    cart.findOne({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
    .catch(err=> console.log(err))
})

router.put('/cart/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    cart.update({
        number: req.body.number
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
})

router.delete('/cart/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    cart.destroy({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    }) 
    .catch(err=>console.log(err))
})



// ORDER route & api

router.get('/manager/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll()
    .then(results=>{
        res.render('user/order', {'data': results})
    })
    .catch(err=> console.log(err))
})


router.get('/manager/template/header/header.txt',(req, res)=>{
        res.render('manager/template/header')   
})
router.get('/manager/template/navi.txt',(req, res)=>{
        res.render('manager/template/navi')   
})
router.get('/manager/wellcome',(req, res)=>{
        res.render('manager/wellcome')   
})
router.get('/manager/store',(req, res)=>{
        res.render('manager/store')   
})
router.get('/manager/pending',(req, res)=>{
        res.render('manager/pending')   
})
router.get('/manager/catalogy',(req, res)=>{
        res.render('manager/catalogy')   
})
router.get('/manager/account',(req, res)=>{
        res.render('manager/account')   
})
router.get('/manager/product',(req, res)=>{
        res.render('manager/product')   
})
router.get('/manager/report',(req, res)=>{
        res.render('manager/report')   
})
router.get('/manager/detail_product',(req, res)=>{
        res.render('manager/detail_product')   
})
router.get('/manager/bill',(req, res)=>{
        res.render('manager/bill')   
})
router.get('/manager/new_product',(req, res)=>{
        res.render('manager/new_product')   
})
router.get('/manager/edit_product/:id',(req, res)=>{
        res.render('manager/edit_product',{'id':req.params.id})   
})

router.get('/manager/detail_product/:id',(req, res)=>{
 	res.render('manager/detail_product',{'id' : req.params.id});
})



router.get('/manager/api/detailbill/:id',passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    billdt.findAll({
        where:{
            id: req.params.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})


router.get('/manager/api/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll()
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/new', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "new"
        }
    })
    .then(results=>{
        res.render('manager/bill',passport.authenticate('jwt', { session: false }), {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/new', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "new"
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})



router.get('/manager/order/new/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "new",
            id: req.params.id
        }
    })
    .then(results=>{
        res.render('manager/bill', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/new/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "new",
            id: req.params.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/pending', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "pending"
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/pending',passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "pending"
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/pending/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    billdt.findAll({
        where:{
            status: "pending",
            id: req.params.id
        }
    })
    .then(results=>{
        res.render('manager/pending', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/pending/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "pending",
            id: req.params.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/cancelled', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "cancelled",
        }
    })
    .then(results=>{
        res.render('manager/cancelled', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/cancelled', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "cancelled",
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/cancelled/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "cancelled",
            id: req.params.id
        }
    })
    .then(results=>{
        res.render('manager/cancelled', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/api/order/cancelled/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            status: "cancelled",
            id: req.params.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})



router.get('/api/like', passport.authenticate('jwt', { session: false }), (req, res)=>{
    like.findOne({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
})

router.post('/like', passport.authenticate('jwt', { session: false }),(req, res)=>{
    like.create({
        userID: req.user.dataValues.id,
        productID: req.body.productID
    })
    res.render('user/index')
})


router.delete('/like/:productID',passport.authenticate('jwt', { session: false }), (req, res)=>{
    like.destroy({
        where: {
            productID: req.params.productID
        }
    })
    res.render('user/index')
})




// STORAGE route & api

router.get('/storage', passport.authenticate('jwt', { session: false }), (req, res)=>{
    store.findAll()
    .then(result=>{
        res.render('manager/store',{'data': result})
    })
})

router.get('/api/storage', passport.authenticate('jwt', { session: false }), (req, res)=>{
    store.findAll()
    .then(result=>{
        res.json({'data': result})
    })
    .catch(err=> console.log(err))
})

router.get('/storage/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    store.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.render('manager/store',{'data': result})
    })
    .catch(err=> console.log(err))
})

router.get('/api/storage/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    store.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
})

router.post('/storage', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    if(!req.body.name || !req.body.position)
        res.json({'message': 'Empty name or position of storage'})
    store.findOne({
        where:{
            name: req.body.name
        }
    })
    .then(result=>{
        if(!result){
            store.create({
                name: req.body.name,
                position: req.body.position
            })
        }
        res.render('manager/store')
    })
    .catch(err=> console.log(err))
})

router.put('/storage/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    store.update({
        position: req.body.position
    }, {
        where:{
            id: req.params.id
        }
    })
    res.render('manager/store')
})

router.delete('/storage/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.role === 0) {
        return res.sendStatus(403);
    }
    store.findOne({
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        if(result)
        {
            store.destroy({
                where:{
                    id: req.params.id
                }
            })
    }
    })
    res.render('manager/store')
})



module.exports = router