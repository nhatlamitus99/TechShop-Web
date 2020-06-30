const db = require('../db')
const sequelize = require('sequelize');

const Order = db.define("Order", {
    userID: sequelize.INTEGER,
    date: sequelize.DATE,
    productID: sequelize.INTEGER,
    number: sequelize.INTEGER,
    status: sequelize.STRING
})

Order.associate = function(models) {
    Order.belongsTo(models.User, {foreignKey: 'userID'})
};

Order.associate = function(models) {
    Order.belongsTo(models.Product, {foreignKey: 'productID'})
};

// db.sync()
// .then(()=>{
//     console.log("Create Order successfully...")
// })

module.exports = Order