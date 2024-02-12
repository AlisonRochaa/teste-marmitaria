const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'administrador',
    password: 'marmitaboa#@',
    database: 'marmitaria'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro na conexão: ' + err.stack);
        return;
    }
    console.log('Conexão bem-sucedida com o ID: ' + connection.threadId);
});

module.exports = connection;