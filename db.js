const sequelize = require('sequelize')

const db = new sequelize({
    database: "favada",
    username: "postgres",
    password: "123456",
    host: "localhost",
    port: 5432,
    dialect: "postgres",
})

db.authenticate()
    .then(() => console.log('Database connected successfully! ...'))
    .catch(err => console.log('Error: ' + err));

module.exports = db