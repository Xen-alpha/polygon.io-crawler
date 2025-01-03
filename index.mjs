import { readFileSync, writeFileSync, existsSync } from "node:fs";
import mongoose from "mongoose";

const TARGETLIST = {
  nasdaq: "nasdaq",
  nyse: "nyse",
  amex: "amex",
};

const API_LIMIT = 25;

class App {
  #date;
  constructor() {
    this.#date = this.#getDateFormat(new Date(Date.now()));
    mongoose.connect("mongodb://127.0.0.1:27017/americastock").then((result) => {
      console.log("MongoDB 연결 성공!")
    }).catch((e) => {
      throw new Error("MongoDB 연결 실패, 앱을 종료합니다!");
    })
  }
  #getDateFormat(date) {
    // Note: 메서드 명칭들이 직관적이지 않다는 점에 주의(웹 검색 필요)
    return `${date.getFullYear()}${date.getMonth() < 9 ? "0" : ""}${date.getMonth() + 1}${date.getDate() < 9 ? "0" : ""}${date.getDate()}`;
  }
  async fetchMetadata(target) {
    if (!existsSync(`result/metadata/${target}_${this.#date}.json`)) {
      fetch(`https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=${target}&download=true`)
        .then((result) => result.json())
        .then((result) => {
          writeFileSync(`result/metadata/${target}_${this.#date}.json`, JSON.stringify(result, null, 1), {
            encoding: "utf8",
            flag: "w+",
          });
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }
  async fetchInfo(url) {
    fetch(url)
      .then((result) => result.json())
      .then((result) => {
        if (!existsSync(`result/${result["Meta Data"]["2. Symbol"]}_${this.#date}.json`)) {
          writeFileSync(`result/${result["Meta Data"]["2. Symbol"]}_${this.#date}.json`, JSON.stringify(result, null, 1), {
            encoding: "utf8",
            flag: "w+",
          });
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }
  async run() {
    // 스키마 생성하고 모델화
    const schema = mongoose.Schema({name: String, code: {type: String, required:true} , price: {type: Number, required:true}, date: {type: Date, required:true}}, {collection:"stock"});
    const StockPrice = mongoose.model("StockPrice", schema);

    // 메타데이터 + 오늘의 주식 가격 호출
    await this.fetchMetadata(TARGETLIST.nasdaq);
    await this.fetchMetadata(TARGETLIST.nyse);
    await this.fetchMetadata(TARGETLIST.amex);
    console.log("Fetched today's data");
    // URL 파라미터는 순서 지켜야 함: function ->symbol -> outputsize -> apikey 순서임
    const APIKey = readFileSync("../APIKey.json").toJSON().key; // key 가져옴
    const limitCounter = 0; // API_LIMIT까지 increase

    // nasdaq, nyse, amex를 융합한 오브젝트의 entries에 대해해 루프 돌면서 다음을 수행
      // 1. MongoDB에 질의하여 주어진 티커 코드를 키로 가진 필드가 존재하는지 질의
      // 2. 필드가 이미 있으면 오늘의 날짜 데이터를를 업데이트함.
      // 3. 쿼리 결과가 1095개(3년치 기록)보다 많은지 확인
      // 4-1. 쿼리 결과가 1095개보다 적을 때 limitCounter가 API_LIMIT보다 작을 때 알파밴티지에 일자별 가격 기록을 질의
      // 4-2. 4-1번에 따라 가격 기록을 질의했다면 컬렉션에 필드로 기록하고 limitCounter를 +1
      // 4-3. 질의에 실패한 경우 limitCounter를 API_LIMIT로 설정하고 나스닥 오늘 데이터 기록만 계속 수행
    console.log("Start writing...");
    /*
    await this.fetchInfo(
      "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&outputsize=full&apikey=demo"
    );
    */
    
  }
}

const app = new App();
await app.run();