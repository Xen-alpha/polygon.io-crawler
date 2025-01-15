import { readFileSync } from "node:fs";
import { mongoose } from "mongoose";

const API_LIMIT = 20;

const TARGETLIST = {
  nasdaq: "nasdaq",
  nyse: "nyse",
  amex: "amex",
};

class Crawler {
  #date;
  constructor() {
    this.#date = this.#getDateFormat(new Date(Date.now()));
  }
  #getDateFormat(originalDate) {
    let date = new Date(originalDate);
    // Note: 메서드 명칭들이 직관적이지 않다는 점에 주의(웹 검색 필요)
    return `${date.getFullYear()}-${date.getMonth() < 9 ? "0" : ""}${date.getMonth() + 1}-${date.getDate() < 9 ? "0" : ""}${date.getDate()}`;
  }
  async fetchMetadata(target) {
    let result = await fetch(`https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=${target}&download=true`);
    result = await result.json();
    return result.data.rows;
  }
  async fetchInfo(url) {
    let result = await fetch(url);
    result = await result.json();
    return result["Time Series (Daily)"];
  }
  async run() {
    try {
      const dbresponse = await mongoose.connect("mongodb://127.0.0.1:27017/americastock")
      console.log("MongoDB 연결 성공!");
    } catch (e) {
      throw new Error("MongoDB 연결 실패, 앱을 종료합니다!");
    }

    // DB 스키마 생성하고 모델화
    const schema = mongoose.Schema({id: Number, name: String, code: {type: String, required:true} , market: {type: String, required : true}, price: {type: String, required:true}, date: {type: String, required:true}}, {collection:"stock"});
    const stockPrice = mongoose.model("StockPrice", schema);

    // API URL에 파라미터로 넣을 키 가져오기기
    const apiKey = JSON.parse(readFileSync("../APIKey.json").toString()).key; // key 가져옴
    let limitCounter = 0; // API_LIMIT까지 increase

    // 메타데이터 배열 가져오기(오늘의 주식 가격들을 포함)
    const nasdaqlist = await this.fetchMetadata(TARGETLIST.nasdaq);
    const nyselist = await this.fetchMetadata(TARGETLIST.nyse);
    const amexlist = await this.fetchMetadata(TARGETLIST.amex);
    console.log("Fetched metadata and today's data");
    // nasdaq, nyse, amex를 융합한 배열 제작
    let totalStocks = [];
    totalStocks = totalStocks.concat(nasdaqlist, nyselist, amexlist);
    // 위 오브젝트의 entries에 대해해 루프 돌면서 다음을 수행
    // 1. 쿼리 결과가 1095개(3년치 기록)보다 많은지 확인
    // 2-1. 쿼리 결과가 1095개보다 적을 때 limitCounter가 API_LIMIT보다 작을 때 알파밴티지에 일자별 가격 기록을 질의
    // 2-2. 4-1번에 따라 가격 기록을 질의했다면 컬렉션에 필드로 기록하고 limitCounter를 +1
    // 2-3. 질의에 실패한 경우 limitCounter를 API_LIMIT로 설정하기
    // 3. 루프를 계속 수행
    console.log("Start writing histories...");
    for (const item of totalStocks) {
      const query = await stockPrice.find({code: item.symbol});
      if (limitCounter >= API_LIMIT) break;
      else if (query.filter((value) => value.date >= "2022-01-02").length < 950 && limitCounter < API_LIMIT) { // 3년치가 안 되는 데이터 발견 시 알파밴티지에 요청
        try {
          const historyResult = await this.fetchInfo(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${item.symbol}&outputsize=full&apikey=${apiKey}`
          );
          let metadataresponse = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${item.symbol}&apikey=${apiKey}`);
          let metadataresult = await metadataresponse.json();
          console.log("crawling "+ item.symbol +"...");
          if (historyResult.Information) throw new Error("API Limit reached!");
          for (const [key, value] of Object.entries(historyResult)) { // 최근 날짜부터 사전에 내림차순 정렬됨
            if (key < "2022-01-02") break; // 2022년 이전 데이터는 무시
            const isThisExists = await stockPrice.find({code: item.symbol, price: value["4. close"], date: key});
            if (isThisExists.length > 0) continue;
            const historyInstance = new stockPrice({id:query.id, name: item.name, code: item.symbol, market: metadataresult["Exchange"].toLowerCase(), price: value["4. close"], date: key});
            await historyInstance.save();
          }
        } catch (e) {
          console.error(e);
        }
        limitCounter = limitCounter + 1; // API 요청 제약에 걸리는 크롤링 요청이 가장 먼저 시작되므로 성공하든 실패하든 limitCounter를 늘려야 함
      }
    }

    mongoose.disconnect();
  }
}

const app = new Crawler();
await app.run();