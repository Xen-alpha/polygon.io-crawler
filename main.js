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
  res.status(404).send({ success: false, reason: "Not a valid URI path" });
});

app.get("/stocklist", async (req, res) => {
  const reqBody = req.body;
  if (!reqBody || !reqBody.code || !reqBody.code === "") {
    res.status(400).send({ success: false, reason: "Body value not given", requestBody: req.body });
    return;
  }
  try {
    const query = await stockPrice.find({code: reqBody.code}).sort({date:'desc'});
    res.send({ success: true, result: query });
  } catch (e) {
    res.status(503).send({ success: false, reason: "Failed to read server-side data", requestBody: req.body });
    return;
  }
});

app.get("/stock", async (req, res) => {
  const reqBody = req.body;
  if (!reqBody || !reqBody.code || !reqBody.code === "") {
    res.status(400).send({ success: false, reason: "Body value not given", requestBody: req.body });
    return;
  }
  try {
    const query = await stockPrice.find({code: reqBody.code}).sort({date:'desc'}).limit(1);
    res.send({ success: true, result: query });
  } catch (e) {
    res.status(503).send({ success: false, reason: "Failed to read server-side data", requestBody: req.body });
    return;
  }
});

app.get("/pricehistory", async (req,res) => {
  try {
    const reqBody = req.body;
    if (!reqBody || !reqBody.code || !reqBody.code === "") {
      res.status(400).send({ success: false, reason: "Body value not given", requestBody: req.body });
      return;
    }
    const query = await stockPrice.find({code: reqBody.code});
    res.send({success: true, code: reqBody.code, result: query});
  } catch (e) {
    res.status(400).send("Bad Request: " + e);
  }
  
});

app.get("/lastprice", async (req,res) => {
  try {
    const reqBody = req.body;
    console.log(reqBody);
    if (!reqBody || !reqBody.code || !reqBody.code === "") {
      res.status(400).send({ success: false, reason: "Body value not given", requestBody: req.body });
      return;
    }
    const query = await stockPrice.find({code: reqBody.code});
    if (query.length > 0) res.send({success: true, code: reqBody.code, result: query[0]["price"]});
    else res.send({ success: false, reason: "Wrong ticker code"})
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
