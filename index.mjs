import { readFileSync, writeFileSync } from "node:fs";

class App {
  constructor() {}
  fetchInfo(url) {
    fetch(url)
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
  async run() {
	// URL 파라미터는 순서 지켜야 함: function ->symbol -> outputsize -> apikey 순서임
    await this.fetchInfo("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=IBM&outputsize=full&apikey=demo");
  }
}

const app = new App();
await app.run();
