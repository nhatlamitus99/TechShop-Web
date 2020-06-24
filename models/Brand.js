const db = require('../db')
const sequelize = require('sequelize')


const Brand = db.define("Brand", {
    name: sequelize.STRING
})

Brand.associate = function(models) {
    Brand.hasMany(models.Product, {foreignKey: 'id'})
  };

// db.sync()
// .then(()=>{
//     console.log("Create Brand successfully...")
// })

module.exports = Brand