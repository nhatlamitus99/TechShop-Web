const app = require('express')
const ejs = require('ejs')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const multer = require('multer')
const router = app.Router()
const upload = multer({ dest: './uploads/' })
const passport = require('passport')
const path = require('path')
const jwt = require('jsonwebtoken')

var user = require('./models/User')
var product = require('./models/Product')
var brand = require('./models/Brand')
var category = require('./models/Category')
var order = require('./models/Order')
var store = require('./models/Storage')
var like = require('./models/Like')
var cart = require('./models/Cart')
var billdt= require('./models/Billdetail')
const { access } = require('fs')

const sequelize = require('sequelize')

const Op = sequelize.Op;

var urlencodedParser = bodyParser.urlencoded({ extended: false })
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/upload/images')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
   
var uploadFile = multer({ storage: storage })


// HOME PAGE

router.get('/', (req, res) => {
    product.findAll()
    .then(products=>{
        category.findAll()
        .then(categories=>{
            brand.findAll()
            .then(brands=>{
                res.render('user/index', {'product': products, 'category': categories, 'brand': brands})
            })
            .catch(err=> console.log(err))
        })
        .catch(err=> console.log(err))       
    } )
    .catch(err=> console.log(err))  
})


// SIGN UP & LOG IN 

router.get('/login', (req, res)=>{
    res.render('user/login')
})



router.post('/login', urlencodedParser, (req, res)=>{
    var _email = req.body.email
    var _password = req.body.password
	
    if(!_email || !_password)
        res.json({'message': 'Empty email or password'})
    const hash = bcrypt.hashSync(_password, 10);
    user.findOne({
        where:{
            email: _email
        }
    }).then( (result) =>{
        if(result) {
            if(bcrypt.compareSync(_password, result.password)){
                var payload = { id: result.id, type: result.type }
                accessToken = jwt.sign(payload, 'secret')
                if(result.type==true)
                    res.render('manager/saveToken', {token: accessToken, user: result.username})
                else
                    res.render('user/index', {token: accessToken })
                //res.status(200).json({token : accessToken})
            }
            else 
                res.json({'message': 'password is incorrect'})
        }
        else{
            res.json({'message': 'email is incorrect'})
        }
    })
    .catch(err=> {
        console.log(err)
        res.redirect('/login')
    })
})

router.post('/signup', urlencodedParser, (req, res)=>{
    var _username = req.body.username
    var _email = req.body.email_signup
    var _phone = req.body.phone
    var _password = req.body.password_signup
    var _re_password = req.body.password_again
    var _address = req.body.address
	
    if((!_email || !_password))
        res.json({'message': 'Empty email or password'})
    if(!req.body.type)
        var _type = false;
    else 
        var _type = req.body.type
    if(!req.body.fullname)
        var _fullname = req.body.username

    if(_password==_re_password){
        user.findOne({
            where:{
                email: _email
            }
        }).then(result =>{ 
            if(result)          
                res.json({'message':'email is used'})
            else{
                var hash = bcrypt.hashSync(_password, 10);
                user.create({
                    fullname: _fullname,
                    username: _username,
                    email: _email, 
                    phone: _phone,
                    password: hash,
                    type: _type,
                    address: _address
                })
                res.render('user/index')
            }
        })
        .catch(err=> {
            console.log(err)
        })
        
    }
    else res.json({'message':'re-password is not correct'})
})


// Signup via Facebook

router.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
    function(req, res) {
        console.log(req.user)
        // var payload = { id: result.id, type: result.type }
        // accessToken = jwt.sign(payload, 'secret')
        // res.status(200).json({token : accessToken})
      res.redirect('/');
});

// Sign up via Google

router.get('/auth/google',  passport.authenticate('google', { scope: ['email']}));

router.get('/auth/google/callback', 
  passport.authenticate('google', { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });


  // USER api

router.get('/api/user', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    user.findAll({
        where:{
            type: false
        }
    })
    .then(result=>{
        res.status(200).json({'data': result})
    })
    .catch(err=> console.log(err))
})

router.get('/api/user/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    user.findAll({
        where:{
            type: false,
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
    if (req.user.dataValues.type === true) {
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
    if (req.user.dataValues.type === true) {
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


// POLICY route 

router.get('/policy', (req, res)=>{
    res.render('user/policy')
})

// USAGE route

router.get('/usage', (req, res)=>{
    res.render('user/usage')
})

// PURCHASE route

router.get('/purchase', (req, res)=>{
    res.render('user/purchase')
})

// PRODUCT route & api

router.get('/product', (req, res)=>{
    if (req.user.dataValues.type === true) {
        return res.sendStatus(403);
    }
    product.findAll()
    .then(results =>{
        res.render('user/product', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/api/product', (req, res)=>{
    product.findAll()
    .then(results =>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/product/:id', (req, res)=>{
    if (req.user.dataValues.type === true) {
        return res.sendStatus(403);
    } 
    var _id = req.params.id 
    product.findOne({
        where:{
            id: _id
        }
    }).then(result=>{
        res.render('user/product', {'data': result})
    }).catch(err=> console.log(err)) 
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
    if (req.user.dataValues.type !== true) {
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
						console.log(_price)
						
						
                        product.create({
                            name: _name,
                            brandID : _brandID,
                            rating: 0,
                            price: _price,
                            info: _info,
                            detail: req.body.detail,
                            image: req.file.destination+"/"+req.file.filename,
                            categoryID: _categoryID,
                            storageID: 0,
                            number: req.body.number,
                            number_sell: 0
                        })
                    
                }     
            }).catch(err=>console.log(err))
        }
    }).catch(err=>console.log(err))
    return res.sendStatus(200)
})

router.put('/product/:id', uploadFile.single('file'), passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.type !== true) {
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


// new -> pending
router.put('/manager/order/pending/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    order.update({
        status: 'pending'
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
}) 

function compareSeller (product1, product2) {
    return product2.number_sell - product1.number_sell;
}

router.get('/api/bestSeller', (req, res)=>{
    product.findAll()
    .then(results =>{
        results.sort(compareSeller);
        var result = results.slice(0,5);
        res.json({'data': result})
    })
    .catch(err=> console.log(err))
})

// pending -> done
router.put('/manager/order/done/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    order.update({
        status: 'done'
    }, {
        where:{
            id: req.params.id
        }
    })
    .then(result=>{
        res.json({'data': result})
    })
}) 

router.delete('/product/:id', passport.authenticate('jwt', { session: false }), (req, res)=>{
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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

router.post('/cart', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type === true) {
        return res.sendStatus(403);
    }
    
    if(!req.body.productID)
        res.json({'message': 'Empty product'})

    if(!req.body.number)
        res.json({'message': 'Empty number of items'})

    cart.create({
        userID: req.user.dataValues.id,
        productID: req.body.productID,
        number: req.body.number
    })
    .then(result=>{
        res.json({'data': result})
    })
})

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

router.get('/cart', passport.authenticate('jwt', { session: false }),(req, res)=>{
    
    cart.findOne({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(result=>{
        res.render('user/cart',{'data': result})
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

router.get('/user/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type === true) {
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

router.get('/user/api/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type === true) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
            userID: req.user.dataValues.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))   
})

router.get('/manager/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
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

router.get('/manager/cancelled',(req, res)=>{
        res.render('manager/cancelled')   
})

router.get('/manager/detail_product',(req, res)=>{
        res.render('manager/detail_product')   
})
router.get('/manager/bill',(req, res)=>{
        res.render('manager/bill')   
})
router.get('/manager/detail_bill/:id',(req, res)=>{
        res.render('manager/detail_bill',{'id':req.params.id})   
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

router.get('/manager/detailstore/:id',(req, res)=>{
 	res.render('manager/detailstore',{'id' : req.params.id});
})


router.get('/manager/api/detailbill/:id',passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
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


router.get('/api/promotion',(req, res)=>{
    product.findAll({
		where:{
				promotion:{[Op.gt]:0}
			
		}
	})
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})


router.get('/manager/api/order', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    order.findAll()
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/new', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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

router.get('/manager/api/order/all/:id', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
        return res.sendStatus(403);
    }
    order.findAll({
        where:{
       
            id: req.params.id
        }
    })
    .then(results=>{
        res.json({'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/manager/order/pending', passport.authenticate('jwt', { session: false }),(req, res)=>{
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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


// LIKE route & api

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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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
    if (req.user.dataValues.type !== true) {
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