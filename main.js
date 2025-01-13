const fs = require("node:fs");
const cors = require("cors");
const express = require("express");
const app = express({ strict: true });
const port = 8000;
const mongoose = require("mongoose");

const connection = mongoose.connect("mongodb://127.0.0.1:27017/americastock");

// DB 스키마 생성하고 모델화
const schema = mongoose.Schema({name: String, code: {type: String, required:true} , price: {type: String, required:true}, date: {type: String, required:true}}, {collection:"stock"});
const stockPrice = mongoose.model("StockPrice", schema);

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(404).send({ isSuccess: false, reason: "Not a valid URI path" });
});

app.get("/stocklist", (req, res) => {
  const reqBody = req.body;
  if (!reqBody || !reqBody.code || !reqBody.code == "") {
    res.status(400).send({ isSuccess: false, reason: "Body value not given", requestBody: req.body });
    return;
  }
  try {
    const metadata = fs.readdirSync(`result/metadata`).sort().reverse();
    const nasdaq = metadata.filter((value) => value.substring(0, 5) === "nasdaq");
    const nyse = metadata.filter((value) => value.substring(0, 3) === "nyse");
    const amex = metadata.filter((value) => value.substring(0, 3) === "amex");
    const nasdaqArray = JSON.parse(fs.readFileSync(nasdaq[0], { encoding: "utf-8" })).data.rows.map((value) => value.symbol); // read-only
    const nyseArray = JSON.parse(fs.readFileSync(nyse[0], { encoding: "utf-8" })).data.rows.map((value) => value.symbol); // read-only
    const amexArray = JSON.parse(fs.readFileSync(amex[0], { encoding: "utf-8" })).data.rows.map((value) => value.symbol); // read-only
    res.send({ isSuccess: true, result: nasdaqArray.concat(nyseArray, amexArray).sort() });
  } catch (e) {
    res.status(503).send({ isSuccess: false, reason: "Failed to read server-side data", requestBody: req.body });
    return;
  }
});

app.get("/stock", async (req,res) => {
  try {
    const ticker = req.body.code;

    const query = await stockPrice.find({code: ticker});
    res.send({isSuccess: true, code: ticker, result: query});
  } catch (e) {
    res.status(400).send("Bad Request: " + e);
  }
  
});

app.get("/stockinfotest", (req, res) => {
  try {
    res.sendFile(`C:/Users/Playdata/Documents/JSCode/Alphavantage/result/IBM.json`);
  } catch {
    res.status(404).send("test failed");
  }
});

app.listen(port, () => {
  console.log(`server opened in ${port}`);
});

app.on("error", () => {
  mongoose.disconnect();
})

app.on("close", () => {
  mongoose.disconnect();
})
