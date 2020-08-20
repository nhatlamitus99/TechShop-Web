const db = require('../db')
const sequelize = require('sequelize');
const { INTEGER } = require('sequelize');


const Product = db.define("Product", {
    name: sequelize.STRING,
    brandID: sequelize.INTEGER,
    rating: sequelize.INTEGER,
    price: sequelize.INTEGER,
    info: sequelize.STRING,
    detail: sequelize.STRING,
    image: sequelize.STRING,
    categoryID: sequelize.INTEGER,
    number: sequelize.INTEGER,
    number_sell: sequelize.INTEGER,
    storageID: sequelize.INTEGER,
	promotion: sequelize.INTEGER
})

Product.associate = function(models) {
    Product.belongsTo(models.Brand, {foreignKey: 'brandID'})
};

Product.associate = function(models) {
    Product.belongsTo(models.Category, {foreignKey: 'categoryID'})
};

Product.associate = function(models) {
    Product.belongsTo(models.Storage, {foreignKey: 'storageID'})
};

Product.associate = function(models) {
    Product.hasMany(models.Order, {foreignKey: 'id'})
};

Product.associate = function(models) {
    Product.hasMany(models.Cart, {foreignKey: 'id'})
};

Product.associate = function(models) {
    Product.hasMany(models.Like, {foreignKey: 'id'})
};

 db.sync()
 .then(()=>{
     console.log("Create Product successfully...")
	})

module.exports = Product