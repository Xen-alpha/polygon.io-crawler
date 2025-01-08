import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { mongoose } from "mongoose";

const TARGETLIST = {
  nasdaq: "nasdaq",
  nyse: "nyse",
  amex: "amex",
};

class App {
  #date;
  constructor() {
    this.#date = this.#getDateFormat(new Date(Date.now()));
  }
  #getDateFormat(date) {
    date.setUTCDate(date.getUTCDate() - 1); // 지구 반대편의 데이터라 시간대 고려하면 하루 정도 어긋나야 함
    // Note: 메서드 명칭들이 직관적이지 않다는 점에 주의(웹 검색 필요)
    return `${date.getFullYear()}-${date.getMonth() < 9 ? "0" : ""}${date.getMonth() + 1}-${date.getDate() < 9 ? "0" : ""}${date.getDate()}`;
  }
  async fetchMetadata(target) {
    let result = await fetch(`https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=${target}&download=true`);
    result = await result.json();
    if (!existsSync(`result/metadata/${target}_${this.#date}.json`)) {
      writeFileSync(`result/metadata/${target}_${this.#date}.json`, JSON.stringify(result, null, 1), {
        encoding: "utf8",
        flag: "w+",
      });
    }
    return result.data.rows;
  }
  async run() {
    try {
      const dbresponse = await mongoose.connect("mongodb://127.0.0.1:27017/americastock")
      console.log("MongoDB 연결 성공!");
    } catch (e) {
      throw new Error("MongoDB 연결 실패, 앱을 종료합니다!");
    }

    // DB 스키마 생성하고 모델화
    const schema = mongoose.Schema({name: String, code: {type: String, required:true} , price: {type: String, required:true}, date: {type: String, required:true}}, {collection:"stock"});
    const stockPrice = mongoose.model("StockPrice", schema);

    // 메타데이터 배열 가져오기(오늘의 주식 가격들을 포함)
    const nasdaqlist = await this.fetchMetadata(TARGETLIST.nasdaq);
    const nyselist = await this.fetchMetadata(TARGETLIST.nyse);
    const amexlist = await this.fetchMetadata(TARGETLIST.amex);
    console.log("Fetched metadata and today's data");
    // nasdaq, nyse, amex를 융합한 배열열 제작
    let totalStocks = [];
    totalStocks = totalStocks.concat(nasdaqlist, nyselist, amexlist);
    // 위 오브젝트의 entries에 대해해 루프 돌면서 다음을 수행
      // 1. MongoDB에 질의하여 주어진 티커 코드를 키로 가진 필드가 존재하는지 질의
      // 2. 필드가 이미 있으면 나스닥에서 가져온온 오늘의 날짜 데이터를 업데이트함.
      // 3. 루프를 계속 수행
    console.log("Start writing...");
    for (const item of totalStocks) {
      const query_check = await stockPrice.find({code: item.symbol, date:this.#date});
      if (query_check.length > 0) {
        console.log(item.symbol +" already crawled!")
        continue;
      }
      const instance = new stockPrice({name: item.name, code: item.symbol, price: item.lastsale.substr(1), date: this.#date });
      try {
        await instance.save();
        // console.log(instance);
      } catch (e) {
          console.error(e);
      }
    }

    mongoose.disconnect();
  }
}

const app = new App();
await app.run();