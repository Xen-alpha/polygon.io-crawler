const cors = require('cors');

const express = require('express');
const app = express();
const port = 3000;

app.use(cors({
  origin: "*",
  credentials: false,
}));

app.get('/', (req,res) => {
  res.sendFile(`C:/Users/Playdata/Documents/JSCode/Alphavantage/result/IBM.json`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
