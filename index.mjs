import { readFileSync, writeFileSync, existsSync } from "node:fs";

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
    // 메타데이터 + 오늘의 주식 가격 호출
    await this.fetchMetadata(TARGETLIST.nasdaq);
    await this.fetchMetadata(TARGETLIST.nyse);
    await this.fetchMetadata(TARGETLIST.amex);

    // URL 파라미터는 순서 지켜야 함: function ->symbol -> outputsize -> apikey 순서임
    await this.fetchInfo(
      "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=IBM&outputsize=full&apikey=demo"
    );
  }
}

const app = new App();
await app.run();
