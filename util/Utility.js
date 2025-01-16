async function fetchMetadata(target) {
  let result = await fetch(`https://api.nasdaq.com/api/screener/stocks?tableonly=true&offset=0&exchange=${target}&download=true`);
  result = await result.json();
  result = result.data.rows.map((value) => {
    let newobject = {};
    newobject.name = value.name;
    newobject.code = value.symbol;
    newobject.market = target;
    return newobject;
  });
  return result;
}

function getDateFormat(date) {
  // Note: 메서드 명칭들이 직관적이지 않다는 점에 주의(웹 검색 필요)
  return `${date.getFullYear()}-${date.getMonth() < 9 ? "0" : ""}${date.getMonth() + 1}-${date.getDate() < 9 ? "0" : ""}${date.getDate()}`;
}


module.exports = {fetchMetadata, getDateFormat};