const db = require('../db')
const sequelize = require('sequelize')


const Storage = db.define("Storage", {
    name: sequelize.STRING,
    position: sequelize.STRING
})

Storage.associate = function(models) {
    Storage.hasMany(models.Product, {foreignKey: 'id'})
};


// db.sync().then(() => {console.log("Create Storage successfully...")});

module.exports = Storage