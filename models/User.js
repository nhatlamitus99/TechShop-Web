const db = require('../db')
const sequelize = require('sequelize')


const User = db.define("User", {
    fullname: sequelize.STRING,
    username: sequelize.STRING,
    email: sequelize.STRING, 
    phone: sequelize.STRING,
    password: sequelize.STRING,
    //type: sequelize.BOOLEAN
})

// db.sync()
// .then(()=>{
//     console.log("Create User successfully...")
// })

module.exports = User