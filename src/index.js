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

// app.use(verifyIfAccountExists);

app.get("/statement", verifyIfAccountExists, (req, res) => {
  const { costumer } = req;

  return res.json(costumer.statement);
});

app.listen(3030);
