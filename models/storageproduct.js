const db = require('../db')
const sequelize = require('sequelize');

const stpr = db.define("Order", {
	storageID: sequelize.INTEGER,
    productID: sequelize.INTEGER,
    total: sequelize.INTEGER
})


 db.sync()
 .then(()=>{
     console.log("Create Order successfully...")
 })

module.exports = stpr