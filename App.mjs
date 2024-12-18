import { readFileSync, writeFileSync } from "node:fs";

class App {
  constructor() {}
  async fetchInfo(ticker, apikey) {
    await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${apikey}`)
      .then((result) => result.json())
      .then((result) => {
        writeFileSync(`result/${result["Meta Data"]["2. Symbol"]}.json`, JSON.stringify(result, null, 1), {
          encoding: "utf8",
		      flag:"w+",
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
  async run(ticker, apikey) {
	// URL 파라미터는 순서 지켜야 함: function ->symbol -> outputsize -> apikey 순서임
    await this.fetchInfo(ticker, apikey).then(result => readFileSync(`result/${ticker}.json`).toJSON());  
  }
}

const app = new App();
await app.run("IBM", "demo");