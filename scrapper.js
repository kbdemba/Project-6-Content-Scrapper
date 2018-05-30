const fs = require("fs"),
      http = require("http"),
      cheerio = require("cheerio"),
      Json2csvParser = require('json2csv').Parser;

checkDirectorySync("./data")
individualLinksToEachShirt()

function individualLinksToEachShirt(){
  let shirtsLink = []
  http.get("http://shirts4mike.com/shirts.php", (res)=>{
    if(res.statusCode === 200){
      let body = ""
      let shirtsLink = []
      res.on("data", data=>{
        body += data.toString()
      })//on data
      res.on("end", (data) => {
        const $ = cheerio.load(body);
        //console.log(body)
        $(".products li").each(function(i,link){
          let a = $(this).children("a").attr("href")
          shirtsLink.push(a)
        })//each
        functionToGoThroughTheLinks(shirtsLink)
      })//on end
    }else{
      console.log(`xxxxxThere’s been a ${res.statusCode} error. Cannot connect to http://shirts4mike.com.`)
    }
  }).on("error", (err) => {
  console.log("xxxThere’s been a 404 error. Cannot connect to http://shirts4mike.com.")
});
}// the function

function functionToGoThroughTheLinks(shirtsLink){
  let data1 = [] // to hold the data that will be written as scv
  //add http://www.shirts4mike.com before the links cz they dont have it
  const shirtsArray = shirtsLink.map((shirtsLink) => {
                        return `http://www.shirts4mike.com/${shirtsLink}`
                      })
  shirtsArray.forEach(function(link, i){
    try{ // incase it did not get the right <li> or they cahnge the structure of the hmtl or something
      http.get(link, (res)=>{
        if(res.statusCode === 200){
          let body = "";
          res.on("data", data=>{
            body += data.toString()
          })//on data
          res.on("end", (data) => {
            const $ = cheerio.load(body)
            let title = $("#content h1:has(span)").text().split(" ").slice(1).join(" ")//
            let price = $("#content .price").text()
            let imgUrl = $("#content .shirt-picture img").attr("src")
            let url = link
            let date = formatDate(new Date());
            data1.push({title,price,imgUrl,url,date})

            // this will make sure all the data is loaded onto the data1 array before writing to the scv file
            if(data1.length === shirtsArray.length){
                createCsvFile(data1)
              }
          })// on end
        }else if(res.statusCode === 404){
          const message = `There has been a ${response.statusCode} error (${http.STATUS_CODES[response.statusCode]}).
          cannot connect to ${link}`;
          const statusCodeError = new Error(message);
          console.log(statusCodeError.message);
        }
      }).on("error", (err) => {
        console.log(`error connecting to ${link} ${err.message}`)
      });
    }catch(err){ console.log(err.message)}
  })//for each
} // function individual arrays

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}// checkDirectorySync
function formatDate(date){
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  return `${year}-${month}-${day}`
} // formatDate

// This writes the data to the csv file
function createCsvFile(myCsvData){
  const fields = ['title', 'price', 'imgUrl', "url", "date"];
  const opts = { fields };
  try {
    const parser = new Json2csvParser(opts);
    const csv = parser.parse(myCsvData);

    fs.writeFile(`data/${formatDate(new Date())}.csv`,csv, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  } catch (err) {
    console.error(err);
  }
}
