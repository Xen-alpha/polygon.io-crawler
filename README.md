# 알파밴티지 크롤링 테스트

* [알파밴티지](https://www.alphavantage.co/)

* [IBM 일자 단위 주가 정보 데모](https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=IBM&outputsize=full&apikey=demo)

* 나스닥 크롤링: 아래 세 개의 주소의 데이터를 긁으면 거래 가능한 미국 상장 주식 전체 목록 및 현재 가격을 가져올 수 있다 
  * https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=nasdaq&download=true
  * https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=nyse&download=true
  * https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=amex&download=true


## 사용 방법
* MongoDB를 설치하고, 기본 포트(27017)로 연 다음, americastock 데이터베이스와 stock 컬렉션을 만듭니다.
* 리포지토리를 클론한 폴더의 상위 디렉토리에 다음과 같은 형태의 APIKey.json 파일을 작성합니다.
```json
  {
    "key": "APIKEYDEMO"
  }
```
* result 폴더 안에 metadata 폴더를 만들어야 합니다.
* 다음 명령어들을 필요에 따라 적절하게 실행합니다.
  * `npm run build` : 오늘의 NASDAQ 가격 크롤링을 시작합니다.
    * 리눅스 환경에서 cron을 사용해 주기적으로 `node index.mjs`를 실행하는 것을 권장합니다.
  * `npm run start` : 크롤링한 데이터를 전달할 API 서버를 시작합니다.
  * `npm run crawl` : 알파밴티지 주가 변동 기록 크롤링을 시작합니다.
    * 기본적으로 1개만 크롤링하게 되어 있습니다.
    * 역시 리눅스 환경에서 cron을 사용해 주기적으로 `node crawler.mjs`를 실행하는 것을 권장합니다.