const db = require('../db')
const sequelize = require('sequelize');

const Order = db.define("Order", {
	userID: sequelize.INTEGER,
    date: sequelize.DATE,
    status: sequelize.STRING,
	address: sequelize.STRING,
	rec_phone: sequelize.STRING
})

Order.associate = function(models) {
    Order.belongsTo(models.User, {foreignKey: 'userID'})
};

Order.associate = function(models) {
    Order.hasMany(models.Billdetail, {foreignKey: 'id'})
};

// db.sync()
// .then(()=>{
//     console.log("Create Order successfully...")
// })

module.exports = Order