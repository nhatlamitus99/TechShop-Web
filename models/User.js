const db = require('../db')
const sequelize = require('sequelize')


const User = db.define("User", {
    fullname: sequelize.STRING,
    username: sequelize.STRING,
    email: sequelize.STRING, 
    phone: sequelize.STRING,
    password: sequelize.STRING,
    address: sequelize.STRING,
    role: sequelize.SMALLINT,
    sex: sequelize.BOOLEAN,
    dob: sequelize.DATE
})

User.associate = function(models) {
    User.hasMany(models.Order, {foreignKey: 'id'})
};

User.associate = function(models) {
    User.hasMany(models.Cart, {foreignKey: 'id'})
};

User.associate = function(models) {
    User.hasMany(models.Like, {foreignKey: 'id'})
};


// db.sync().then(() => {console.log("Create User successfully...")});

module.exports = User