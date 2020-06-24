const db = require('../db')
const sequelize = require('sequelize')


const Category = db.define("Category", {
    name: sequelize.STRING
})

Category.associate = function(models) {
    Category.hasMany(models.Product, {foreignKey: 'id'})
  };


// db.sync()
// .then(()=>{
//     console.log("Create Category successfully...")
// })

module.exports = Category