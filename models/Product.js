const db = require('../db')
const sequelize = require('sequelize')


const Product = db.define("Product", {
    name: sequelize.STRING,
    brandID: sequelize.INTEGER,
    rating: sequelize.INTEGER,
    price: sequelize.INTEGER,
    info: sequelize.STRING,
    detail: sequelize.STRING,
    image: sequelize.STRING,
    categoryID: sequelize.INTEGER 
})

Product.associate = function(models) {
    Product.belongsTo(models.Brand, {foreignKey: 'brandID'})
};

Product.associate = function(models) {
    Product.belongsTo(models.Category, {foreignKey: 'categoryID'})
  };

// db.sync()
// .then(()=>{
//     console.log("Create Product successfully...")
// })

module.exports = Product