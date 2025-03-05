import { readFileSync } from "node:fs";
import { fetchMetadata, getDateFormat } from "./util/Utility.js";
import { mongoose } from "mongoose";

const TARGETLIST = {
  nasdaq: "nasdaq",
  nyse: "nyse",
  amex: "amex",
};

let counter = 0;
let timerInstance;

const callback = async (totalStocks, stockPrice, key) => {
  console.log(`Fetching ${totalStocks[counter].code} Data...`);
  let olddate = new Date(Date.now());
  let code = totalStocks[counter].code;
  let market= totalStocks[counter].market;
  let name = totalStocks[counter].name;
  counter++;
  if (counter >= totalStocks.length) {
    clearInterval(timerInstance);
    mongoose.disconnect();
  }
  olddate.setMonth(olddate.getMonth() - 23);
  // 최근 1년 데이터 받아옴
  let response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${code}/range/1/day/${getDateFormat(olddate)}/${getDateFormat(new Date(Date.now()))}?adjusted=true&sort=desc&apiKey=${key}`);
  response = await response.json();
  const timeSeries = response.results.map((value) => {
    let newObject = {};
    newObject.price = value.c;
    newObject.timestamp = value.t;
    return newObject;
  });
  for (const item of timeSeries) {
    const result = await stockPrice.findOne({ code: code, date: item.timestamp});
    if (result) {
      console.log(`Date ${item.timestamp} already exists for ${code}`);
      continue;
    }
    const instance = new stockPrice({id: counter, name: name, code: code, market: market, price: item.price, date: item.timestamp });
    try {
      await instance.save();
    } catch (e) {
        console.error(e);
    }
  }
  console.log(`Fetched ${code} Data...`);
}

class App {
    
  async run() {
    let apiKey = ""
    try {
      const configfile = JSON.parse(readFileSync("../APIKey.json", {encoding: 'utf-8'}).toString());
      apiKey = configfile.key;
      const dbAddress = configfile.address;
      console.log(dbAddress);
      const dbresponse = await mongoose.connect(dbAddress);
      console.log("MongoDB 연결 성공!");
    } catch (e) {
      throw new Error("MongoDB 연결 실패, 앱을 종료합니다!");
    }

    // DB 스키마 생성하고 모델화
    const schema = mongoose.Schema({id: Number, name: String, code: {type: String, required:true} , market: {type: String, required : true}, price: {type: Number, required:true}, date: {type: Number, required:true}}, {collection:"stock"});
    const stockPrice = mongoose.model("StockPrice", schema);

    // 메타데이터 배열 가져오기(오늘의 주식 가격들을 포함)
    const nasdaqlist = await fetchMetadata(TARGETLIST.nasdaq);
    const nyselist = await fetchMetadata(TARGETLIST.nyse);
    const amexlist = await fetchMetadata(TARGETLIST.amex);
    console.log("Fetched metadata and today's data");
    // nasdaq, nyse, amex를 융합한 배열열 제작
    let totalStocks = [];
    totalStocks = totalStocks.concat(nasdaqlist, nyselist, amexlist);
    // 위 오브젝트의 entries에 대해해 루프 돌면서 다음을 수행
      // 1. MongoDB에 질의하여 주어진 티커 코드를 키로 가진 필드가 존재하는지 질의
      // 2. 필드가 이미 있으면 나스닥에서 가져온온 오늘의 날짜 데이터를 업데이트함.
      // 3. 루프를 계속 수행
    console.log("Start writing...");
    timerInstance = setInterval( callback, 15000, totalStocks, stockPrice, apiKey);
  }
}

const app = new App();
await app.run();
