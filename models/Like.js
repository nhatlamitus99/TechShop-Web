const db = require('../db')
const sequelize = require('sequelize')


const Like = db.define("Like", {
    userID: sequelize.INTEGER,
    productID: sequelize.INTEGER
})

Like.associate = function(models) {
    Like.belongsTo(models.User, {foreignKey: 'userID'})
};

Like.associate = function(models) {
    Like.belongsTo(models.Product, {foreignKey: 'productID'})
};


// db.sync().then(() => {console.log("Create Like successfully...")});

module.exports = Like