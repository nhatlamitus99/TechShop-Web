const app = require('express')
const ejs = require('ejs')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const multer = require('multer')
const router = app.Router()
const upload = multer({ dest: './uploads/' })
const resize = require('./public/upload/resize')
const passport = require('passport')
const path = require('path')


var user = require('./models/User')
var product = require('./models/Product')
var brand = require('./models/Brand')
var category = require('./models/Category')



var urlencodedParser = bodyParser.urlencoded({ extended: false })

router.get('/', (req, res) => {
    res.render('user/index')
})

router.get('/login', (req, res)=>{
    res.render('user/login')
})

router.post('/login', urlencodedParser, (req, res)=>{
    var _email = req.body.email
    var _password = req.body.password
    const hash = bcrypt.hashSync(_password, 10);
    user.findOne({
        where:{
            email: _email
        }
    }).then(result =>{
        console.log(result)
        if(bcrypt.compareSync(_password, result.password))
            res.render('user/index')
        else 
        res.render('user/login')
    })
    .catch(err=> {
        console.log(err)
        res.render('user/login')
    })
})

router.post('/signup', urlencodedParser, (req, res)=>{
    var _fullname = req.body.fullname
    var _username = req.body.username
    var _email = req.body.email_signup
    var _phone = req.body.phone
    var _password = req.body.password_signup
    var _re_password = req.body.password_again
    if(_password==_re_password){
        user.findOne({
            where:{
                email: _email
            }
        }).then(result =>{ 
            if(result)          
                res.render('user/login')
            else{
                var hash = bcrypt.hashSync(_password, 10);
                user.create({
                    fullname: _fullname,
                    username: _username,
                    email: _email, 
                    phone: _phone,
                    password: hash,
                    //type: false
                })
            res.render('user/index')
            }
        })
        .catch(err=> {
            console.log(err)
        })
        
    }
    else res.render('user/login')
})

router.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
});

router.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect : '/', failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
});

router.get('/auth/google',  passport.authenticate('google', { scope: ['email']}));

router.get('/auth/google/callback', 
  passport.authenticate('google', { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}  

router.get('/checkout', (req, res)=>{
    res.render('user/checkout')
})

router.get('/policy', (req, res)=>{
    res.render('user/policy')
})

router.get('/product', (req, res)=>{
    product.findAll()
    .then(results =>{
        res.render('user/product', {'data': results})
    })
    .catch(err=> console.log(err))
})

router.get('/product/:id', (req, res)=>{ 
    var _id = req.params.id 
    product.findOne({
        where:{
            id: _id
        }
    }).then(result=>{
        res.render('user/product', {'data': result})
    }).catch(err=> console.log(err)) 
})

router.get('/manager/product', (req, res)=>{
    res.render('manager/add_product')
})

router.post('/product', (req, res)=>{
    // var _name = req.body.name
    // console.log(req.body)
    // var _brand = req.body.brand_name
    // var _brandID = 0
    // var _categoryID = 0
    // brand.findOne({
    //     where:{
    //         name: _brand
    //     }
    // }).then(result=>{
    //     if(result){
    //         _brandID = result.id
    //     }
    // }).catch(err=>console.log(err))
    // var _info = req.body.info
    // var _price = req.body.price
    // var _category = req.body.category
    // category.findOne({
    //     where:{
    //         name: _category
    //     }
    // }).then(result=>{
    //     if(result){
    //         _categoryID = result.id
    //     }
    // }).catch(err=>console.log(err))

    console.log(req.file)

    const imagePath = path.join(__dirname, 'upload/images');
    const fileUpload = new resize(imagePath);
    if (!req.file) {
        res.status(401).json({error: 'Please add an image'});
    }
    const filename = fileUpload.save(req.file.buffer, "_name");

    // product.create({
    //     name: _name,
    //     brandID : _brandID,
    //     rating: 0,
    //     price: _price,
    //     info: _info,
    //     detail: "_detail",
    //     image: filename,
    //     categoryID: _categoryID
    // })
    res.render('manager/product')
})

router.post('/brand', (req, res)=>{
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

router.post('/category', (req, res)=>{
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

router.get('/cart', (req, res)=>{
    res.render('user/cart')
})


module.exports = router