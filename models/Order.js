const db = require('../db')
const sequelize = require('sequelize');

const Order = db.define("Order", {
	userID: sequelize.INTEGER,
    date: sequelize.DATE,
    status: sequelize.SMALLINT, // 0: Đang đóng gói, 2: Đang vận chuyển, 3: Giao thành công
	address: sequelize.STRING,
	rec_phone: sequelize.STRING
})

Order.associate = function(models) {
    Order.belongsTo(models.User, {foreignKey: 'userID'})
};

Order.associate = function(models) {
    Order.hasMany(models.Billdetail, {foreignKey: 'id'})
};


// db.sync().then(() => {console.log("Create Order successfully...")});

module.exports = Order