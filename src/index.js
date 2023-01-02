const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());

const costumers = [];

function verifyIfAccountExists(req, res, next) {
  const { cpf } = req.headers;

  const costumer = costumers.find((item) => item.cpf === cpf);

  if (!costumer) {
    return res.status(404).json({ error: "Costumer not found" });
  } else {
    req.costumer = costumer;

    return next();
  }
}

// app.use(verifyIfAccountExists);

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === "debit") {
      return accumulator + operation.amount;
    } else {
      return accumulator - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const costumerAlreadyExists = costumers.some((item) => item.cpf === cpf);

  if (costumerAlreadyExists) {
    return res.status(400).json({ error: "Costumer already exists" });
  }

  costumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

app.get("/account", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;

  return res.status(200).json(costumer);
});

app.put("/account", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const { name } = req.body;

  costumer.name = name;

  return res.status(201).send();
});

app.delete("/account", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;

  costumers.splice(costumer, 1);

  return res.json(costumers);
});

app.get("/statement", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;

  return res.json(costumer.statement);
});

app.get("/balance", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const currentBalance = getBalance(costumer.statement);
  return res.json({ balance: currentBalance });
});

app.get("/statement/date", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statementFilteredByDate = costumer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  );

  return res.json(statementFilteredByDate);
});

app.post("/deposit", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const { description, amount } = req.body;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "debit",
  };

  costumer.statement.push(statementOperation);

  console.log("deposit", statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;
  const { amount, description } = req.body;

  const currentBalance = getBalance(costumer.statement);

  if (currentBalance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  } else {
    const statementOperation = {
      description,
      amount,
      created_at: new Date(),
      type: "credit",
    };

    console.log("withdraw", statementOperation);

    costumer.statement.push(statementOperation);

    return res.status(201).send();
  }
});

app.listen(3030);
