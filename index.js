const connection = require('./conexao');
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const queryAsync = promisify(connection.query).bind(connection);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// CÓDIGOS DA PAGINA DE LOGIN

const usuario = 'admin';
const senha = '123456';
const secret = 'secreto'

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(username == usuario && password == senha){
        const token = jwt.sign({userId: 1}, secret, { expiresIn: 7200});
        return res.json({ auth: true, token });
    }

    res.status(401).end();
});

function verificarAcesso(req, res, next) {
    const token = req.headers['x-acess-token'];
    if (!token) {
        return res.redirect('/index.html'); // Redireciona para a página de login se o token não estiver presente
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).end(); // Retorna 401 se o token for inválido
        }
        next(); // Chama a próxima função se o token for válido
    });
}

// CÓDIGOS RESPONSÁVEIS PELA PÁGINA DE CADASTROS E CONSULTAS DE CLIENTES E PRODUTOS

// Mostra todos os produtos cadastrados no banco de dados, em uma lista no front-end
app.get('/produtos', verificarAcesso, (req, res) => {
    const sql = 'SELECT * FROM tb_produtos';
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Erro ao buscar produtos:', err);
            res.status(500).json({ error: 'Erro ao buscar produtos' });
            return;
        }
        res.json(result);
    });
});

// Rota para excluir um produto pelo ID
app.delete('/produtos/:id', verificarAcesso, (req, res) => {
    const idProduto = req.params.id;

    // Query SQL para excluir o produto com base no ID fornecido
    const sql = `DELETE FROM tb_produtos WHERE id_produto = ?`;

    // Executar a query no banco de dados
    connection.query(sql, [idProduto], (error, results) => {
        if (error) {
            console.error('Erro ao excluir o produto:', error);
            res.status(500).send('Erro ao excluir o produto');
        } else {
            console.log('Produto excluído com sucesso.');
            res.status(200).send('Produto excluído com sucesso');
        }
    });
});

// Rota para buscar um produto pelo nome
app.get('/buscar-produto', verificarAcesso, (req, res) => {
    const nomeProduto = req.query.nome;
  
    // Consulta SQL para buscar o produto pelo nome na tabela tb_produtos
    const sql = `SELECT * FROM tb_produtos WHERE nome_produto LIKE ?`;

    const nomePesquisa = '%' + nomeProduto + '%';
  
    connection.query(sql, [nomePesquisa], (err, results) => {
      if (err) {
        console.error('Erro ao buscar produto:', err);
        res.status(500).send('Erro ao buscar produto.');
        return;
      }
  
      // Verifica se o produto foi encontrado
      if (results.length > 0) {
        res.json(results); // Retorna os dados dos produtos em formato JSON
      } else {
        res.status(404).send('Produto não encontrado.');
      }
    });
});

// Mostra todos os clientes cadastrados no banco de dados, em uma lista no front-end
app.get('/clientes', verificarAcesso, (req, res) => {
    const sql = 'SELECT * FROM tb_cliente';
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            res.status(500).json({ error: 'Erro ao buscar clientes' });
            return;
        }

        res.json(result);
    });
});

// Rota para excluir um cliente pelo ID
app.delete('/clientes/:id', verificarAcesso, (req, res) => {
    const idCliente = req.params.id;

    // Query SQL para excluir o cliente com base no ID fornecido
    const sql = `DELETE FROM tb_cliente WHERE id_cliente = ?`;

    // Executar a query no banco de dados
    connection.query(sql, [idCliente], (error, results) => {
        if (error) {
            console.error('Erro ao excluir o cliente:', error);
            res.status(500).send('Erro ao excluir o cliente');
        } else {
            res.status(200).send('Cliente excluído com sucesso');
        }
    });
});

// Rota para buscar um cliente pelo nome
app.get('/buscar-cliente', verificarAcesso, (req, res) => {
    const nomeCliente = req.query.nome;
  
    // Consulta SQL para buscar o cliente pelo nome na tabela tb_cliente
    const sql = `SELECT * FROM tb_cliente WHERE nome LIKE ?`;

    const nomePesquisa = '%' + nomeCliente + '%';
  
    connection.query(sql, [nomePesquisa], (err, results) => {
      if (err) {
        console.error('Erro ao buscar cliente:', err);
        res.status(500).send('Erro ao buscar cliente.');
        return;
      }
  
      // Verifica se o cliente foi encontrado
      if (results.length > 0) {
        res.json(results); // Retorna os dados do cliente em formato JSON
      } else {
        res.status(404).send('Cliente não encontrado.');
      }
    });
});

//recebe os dados do formulario de cadastro de novos produtos
app.post('/formulario-produto', verificarAcesso, (req, res) => {

    const { nomeProduto, precoProduto } = req.body;

    const sql = 'INSERT INTO tb_produtos (nome_produto, preco_produto) VALUES (?, ?)';
    connection.query(sql, [nomeProduto, precoProduto], (err, result) => {
    if (err) {
      console.error('Erro ao inserir dados no banco de dados:', err);
      res.status(500).send('Erro ao inserir dados no banco de dados');
      return;
    }
    res.status(200).send('Dados inseridos com sucesso no banco de dados');
  });
});

//recebe os dados do formulario de cadastro de novos clientes
app.post('/formulario-cliente', verificarAcesso, (req, res) => {

    const { nomeCliente, cpfCliente, telefoneCliente, bairroCliente, ruaCliente, numeroCasaCliente } = req.body;

    const sql = 'INSERT INTO tb_cliente (nome, cpf, telefone, bairro, rua, numero) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [nomeCliente, cpfCliente, telefoneCliente, bairroCliente, ruaCliente, numeroCasaCliente], (err, result) => {
    if (err) {
      console.error('Erro ao inserir dados no banco de dados:', err);
      res.status(500).send('Erro ao inserir dados no banco de dados');
      return;
    }
    res.status(200).send('Dados inseridos com sucesso no banco de dados');
  });
});

// PARTE DO CÓDIGO QUE VAI SER RESPONSÁVEL PELO CADASTRO DE NOVOS PEDIDOS

//Rota para receber o formulário de cadastro de pedidos
app.post('/cadastrar-pedido', verificarAcesso, (req, res) => {

    const dadosPedido = req.body;

    //calcula o valor total do pedido e armazena na constante valorTotal
    const valorTotal = dadosPedido.produtos.reduce((total, produto) => {
        return total + (produto.quantidade * produto.valorProduto);
    }, 0);
    valorTotalFormatado = `R$${valorTotal.toFixed(2)}`;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    //lógica que vai montar o pedido no formato "QTDx NomeProduto Valor 999"
    const { produtos } = dadosPedido;

    // String para armazenar os itens do pedido
    let itensPedidoString = '';

    // Iterar sobre os produtos do pedido
    produtos.forEach(produto => {
    // Formatar a string do item do pedido
    const itemPedidoString = `${produto.quantidade}x ${produto.nomeProduto} R$${produto.valorProduto.toFixed(2)}`;

    // Adicionar o item formatado à string total
    itensPedidoString += itemPedidoString + ' / ';
    });

    // Remover o último espaço e a barra da string
    itensPedidoString = itensPedidoString.slice(0, -2);


    const sql = `INSERT INTO tb_pedidos (nome_cliente, itens_pedido, valor_total, data_pedido, hora_pedido) VALUES (?, ?, ?, ?, ?)`;
    connection.query(sql, [dadosPedido.nomeCliente, itensPedidoString, valorTotalFormatado, dadosPedido.data, dadosPedido.hora], 
    (err, result) => {
    if (err) {
        console.error('Erro ao inserir os dados do pedido:', err);
        res.status(500).send('Erro ao cadastrar o pedido.');
        return;
    }
    res.status(200).send('Pedido cadastrado com sucesso!');
});
});

// Rota para obter sugestões de clientes
app.get('/clientes/sugestoes', verificarAcesso, (req, res) => {
    const termo = req.query.termo; // Obtém o termo de busca do parâmetro de consulta

    // Consulta SQL para buscar clientes com base no termo de busca
    const sql = 'SELECT nome FROM tb_cliente WHERE nome LIKE ?';
    connection.query(sql, [`%${termo}%`], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar sugestões de clientes:', err);
            res.status(500).json({ error: 'Erro ao buscar sugestões de clientes' });
            return;
        }

        const sugestoes = rows.map(row => row.nome); // Extrai os nomes dos clientes

        res.json({ sugestoes });
    });
});

// Rota para obter sugestões de produtos
app.get('/produtos/sugestoes', verificarAcesso, (req, res) => {
    const termo = req.query.termo; // Obtém o termo de busca do parâmetro de consulta

    // Consulta SQL para buscar produtos com base no termo de busca
    const sql = 'SELECT nome_produto, preco_produto FROM tb_produtos WHERE nome_produto LIKE ?';
    connection.query(sql, [`%${termo}%`], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar sugestões de produtos:', err);
            res.status(500).json({ error: 'Erro ao buscar sugestões de produtos' });
            return;
        }

        const sugestoes = rows.map(row => {
            return {
                nome_produto: row.nome_produto,
                preco_produto: row.preco_produto
            };
        }); // Extrai os nomes e preços dos produtos

        res.json({ sugestoes });
    });
});

// PARTE RESPONSÁVEL PELA PÁGINA DE HISTÓRICO DE PEDIDOS E RELATÓRIO PDF

// Rota para obter o histórico de pedidos
app.get('/historico-pedidos', verificarAcesso, (req, res) => {
    const sql = 'SELECT * FROM tb_pedidos';
  
    // Executa a consulta SQL
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('Erro ao buscar pedidos:', err);
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
        return;
      }
  
      res.json(result);
    });
});

// Rota para obter o histórico a partir da busca
app.get('/historico-pedidos-busca', verificarAcesso, (req, res) => {
    const { nomeCliente, dataInicio, dataFim } = req.query;

    // Consulta SQL para buscar pedidos do cliente
    const sqlPedidos = `SELECT * FROM tb_pedidos WHERE nome_cliente LIKE '%${nomeCliente}%' AND data_pedido BETWEEN '${dataInicio}' AND '${dataFim}'`;

    // Consulta SQL para buscar informações do cliente
    const sqlCliente = `SELECT * FROM tb_cliente WHERE nome = ?`;

    // Execute as consultas SQL em paralelo
    Promise.all([
        queryAsync(sqlPedidos),
        queryAsync(sqlCliente, [nomeCliente])
    ])
    .then(([pedidosResult, clienteResult]) => {
        // Combine os resultados das consultas em um único objeto de resposta
        const response = {
            pedidos: pedidosResult,
            cliente: clienteResult[0] // Assume que a consulta ao cliente retorna apenas um resultado
        };
        res.json(response);
    })
    .catch(error => {
        console.error('Erro ao buscar pedidos e informações do cliente:', error);
        res.status(500).json({ error: 'Erro ao buscar pedidos e informações do cliente' });
    });
});

// Rota para excluir um pedido baseado no ID
app.delete('/pedidos/:id', verificarAcesso, (req, res) => {
    const idPedido = req.params.id;

    // Query SQL para excluir o pedido com base no ID fornecido
    const sql = `DELETE FROM tb_pedidos WHERE id_pedido = ?`;

    // Executar a query no banco de dados
    connection.query(sql, [idPedido], (error, results) => {
        if (error) {
            console.error('Erro ao excluir o pedido:', error);
            res.status(500).send('Erro ao excluir o pedido');
        } else {
            res.status(200).send('Pedido excluído com sucesso');
        }
    });
});

// Rota para alterar status do pedido
app.post('/alterar-status-pedidos', verificarAcesso, async (req, res) => {
    try {
        const pedidosParaAlterar = req.body.pedidos;

        // Verifica se pedidosParaAlterar é uma matriz
        if (!Array.isArray(pedidosParaAlterar)) {
            throw new Error('A lista de pedidos para alterar não é uma matriz.');
        }

        // Inicia a transação
        await connection.beginTransaction();

        // Itera sobre os IDs dos pedidos para alterar
        for (const idPedido of pedidosParaAlterar) {
            // Consulta o status atual do pedido
            const rows = await new Promise((resolve, reject) => {
                connection.query('SELECT status_pedido FROM tb_pedidos WHERE id_pedido = ?', [idPedido], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });

            // Verifica se há resultados e se o resultado é um array
            if (Array.isArray(rows) && rows.length > 0) {
                const novoStatus = rows[0].status_pedido === 0 ? 1 : 0;

                // Atualiza o status do pedido
                await new Promise((resolve, reject) => {
                    connection.query('UPDATE tb_pedidos SET status_pedido = ? WHERE id_pedido = ?', [novoStatus, idPedido], (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
                });
            }
        }

        // Comita a transação
        await connection.commit();

        res.status(200).send('Status dos pedidos alterado com sucesso.');
    } catch (error) {
        // Em caso de erro, faz rollback na transação
        await connection.rollback();
        console.error('Erro ao alterar o status dos pedidos:', error);
        res.status(500).send('Erro ao alterar o status dos pedidos.');
    }
});

// Rota para gerar o relatório em PDF dos pedidos
app.post('/gerar-pdf', verificarAcesso, (req, res) => {
    const { pedidos, dadosCliente, datasRelatorio } = req.body;

    const dataInicialOriginal = datasRelatorio.dataInicial;
    const partes = dataInicialOriginal.split("-");
    const dataInicialInvertida = partes[2] + "-" + partes[1] + "-" + partes[0];

    const dataFinalOriginal = datasRelatorio.dataFinal;
    const partes2 = dataFinalOriginal.split("-");
    const dataFinalInvertida = partes2[2] + "-" + partes2[1] + "-" + partes2[0];
    
    const doc = new PDFDocument();
    // Cria um buffer para armazenar o conteúdo do PDF
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () =>{
        // Concatena todos os buffers para formar o conteúdo completo do PDF
        const pdfData = Buffer.concat(buffers);
        // Define o tipo de conteúdo do cabeçalho da resposta HTTP como application/pdf
        res.setHeader('Content-type', 'application/pdf');
        // Envia o PDF como resposta HTTP
        res.send(pdfData);
    })
   
    doc.fontSize(12);
    doc.text('Relatório de Pedidos', { align: 'center' });
    doc.moveDown(); // Mover para baixo
    doc.text('Período dos Pedidos');
    doc.text(`${dataInicialInvertida} até ${dataFinalInvertida}`);
    doc.moveDown();
    // Adiciona as informações do cliente abaixo do cabeçalho
    doc.text(`Nome do Cliente: ${dadosCliente.nome}`);
    doc.text(`CPF: ${dadosCliente.cpf}`);
    doc.text(`Telefone: ${dadosCliente.telefone}`);
    doc.text(`Bairro: ${dadosCliente.bairro}`);
    doc.text(`Rua: ${dadosCliente.rua}`);
    doc.text(`Número: ${dadosCliente.numero}`);
    doc.moveDown(); // Mover para baixo após as informações do cliente

    // Gerar conteúdo do PDF com base nos dados dos pedidos
    pedidos.forEach((pedido, index) => {
        doc.text(`Pedido #${index + 1}`, { underline: true });
        doc.text(`ID: ${pedido.idPedido}`);
        // Dividir a string produtosPedido em partes separadas por "/"
        const itens = pedido.produtosPedido.split(' / ');        
        // Adicionar cada item como uma nova linha no PDF
        itens.forEach((item) => {
            // Adicionar um espaço após cada barra (/)
            const itemFormatado = item.replace(/\//g, '/ ');
            doc.text(`Produtos: ${itemFormatado}`);
        });
        doc.text(`Valor Total: ${pedido.valorTotal}`);
        doc.text(`Data: ${pedido.dataPedido}`);
        doc.text(`Hora: ${pedido.horaPedido}`);
        doc.moveDown(); // Mover para baixo antes do próximo pedido
    });

    doc.moveDown();
    doc.moveDown();
    doc.text('________________________________________________', {align: 'center'});
    doc.text(dadosCliente.nome, { align: 'center'});
    doc.text('Assinatura', { align: 'center'});

    // Finalizar o documento
    doc.end();
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});