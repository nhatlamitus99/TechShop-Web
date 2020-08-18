const db = require('../db')
const sequelize = require('sequelize');

const Billdetail = db.define("Billdetail", {
	idBill: sequelize.INTEGER,
	idProduct: sequelize.INTEGER,
    total: sequelize.INTEGER,
	price: sequelize.INTEGER,
	note: sequelize.STRING
})

Billdetail.associate = function(models) {
    Billdetail.belongsTo(models.Order, {foreignKey: 'idBill'})
};
Billdetail.associate = function(models) {
    Billdetail.belongsTo(models.Product, {foreignKey: 'idProduct'})
};


// db.sync().then(() => {console.log("Create Billdetail successfully...")});

module.exports = Billdetail;