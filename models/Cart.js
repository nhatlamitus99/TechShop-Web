const db = require('../db')
const sequelize = require('sequelize');
const bodyParser = require('body-parser');


const Cart = db.define("Cart", {
    userID: sequelize.INTEGER,
    productID: sequelize.INTEGER,
    number: sequelize.INTEGER
})

Cart.associate = function(models) {
    Cart.belongsTo(models.User, {foreignKey: 'userID'})
};

Cart.associate = function(models) {
    Cart.belongsTo(models.Product, {foreignKey: 'productID'})
};


// db.sync().then(() => {console.log("Create Cart successfully...")});

module.exports = Cart