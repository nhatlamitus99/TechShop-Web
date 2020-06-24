const sequelize = require('sequelize')

const db = new sequelize({
    database: "PTUDW",
    username: "postgres",
    password: "991999",
    host: "localhost",
    port: 5432,
    dialect: "postgres"
})

// db.authenticate()
// .then(() => console.log('Connect database successfully'))
// .catch(err=> console.log(err))

module.exports = db