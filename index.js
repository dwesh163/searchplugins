// Script that take a JSON list of OpenSearch and generate :
// - XML files
// - an HTML file that references all the OpenSearch
const fs = require("fs");

let args = process.argv.slice(2);
let dataFile = args[0];
if (!fs.existsSync(dataFile)) {
  dataFile = "list.json";
}
const data = JSON.parse(
  fs.readFileSync(dataFile, { encoding: "utf8", flag: "r" })
);
if (!fs.existsSync("opensearch")) {
  fs.mkdirSync("opensearch");
};

let HTMLTemplate = fs.readFileSync("index-template.html", {
  encoding: "utf8",
  flag: "r",
});
let updatedTemplate = "";
let opensearch_data = "\n";
let opensearch_info = "\n    <ul>\n";
let iterations = data.length;
for (const element of data) {
  let opensearchDir = "opensearch/";
  let opensearchFile = element.shortName.replace(/[^A-Z0-9]+/gi, "-");
  let opensearchPath = opensearchDir + opensearchFile + ".xml";
  try {
    fs.writeFileSync(opensearchPath, generateOpenSearchXML(element));
    console.log(`${opensearchPath} file has been saved.`);
  } catch (err) {
    console.error(err);
  }
  opensearch_data += `    <link rel="search" type="application/opensearchdescription+xml" href="${opensearchPath}" title="${element.shortName}">\n`;
  updatedTemplate = HTMLTemplate.replace(
    /{{ OPENSEARCH_DATA }}/g,
    opensearch_data
  );

  opensearch_info += `        <li><a href="${
    element.searchURL
  }" target="_blank"><img src="${generateDataImage(element.image["16"])}" /></a> <b>${
    element.shortName
  }</b> (${element.description})</li>`;
  if (!--iterations) {
    opensearch_info += `    </ul>`;
  }
  updatedTemplate = updatedTemplate.replace(
    /{{ OPENSEARCH_INFO }}/g,
    opensearch_info
  );
}
fs.writeFile("index.html", updatedTemplate, "utf8", function (err) {
  if (err) return console.log(err);
});

function generateOpenSearchXML(data) {
  let date = new Date();
  //let url = new URL(data.searchQueryURL);
  //console.debug(url.pathname);
  let images = '';
  let iterations = data.image.length;
  for (const img in data.image) {
    images += `       <Image height="${img}" width="${img}">${generateDataImage(data.image[img])}</Image>`;
    if (--iterations) {
      images += `\n`;
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
  <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
                         xmlns:moz="http://www.mozilla.org/2006/browser/search/">
    <!-- Last generated on ${date.toISOString()} -->
    <ShortName>${data.shortName}</ShortName>
    <Description>${data.shortName}</Description>
    <InputEncoding>UTF-8</InputEncoding>
${images}
    <Url type="text/html" method="get" template="${data.searchQueryURL}"/>
    <moz:SearchForm>${data.searchURL}</moz:SearchForm>
    <Contact>${data.contact}</Contact>
    <Developer>${data.contact}</Developer>
  </OpenSearchDescription>`;
}

function generateDataImage(img) {
  /* When possible, search engines should offer a 16x16 image of type "image/x-icon" or "image/vnd.microsoft.icon" (the Microsoft ICO format) and a 64x64 image of type "image/jpeg" or "image/png". */
  const contents = fs.readFileSync(img);
  const b64 = contents.toString("base64");
  const file_ext = img.split('.').pop();
  let mime = '';
  switch (file_ext) {
    case "png":
      mime = "image/png";
      break;
    case "ico":
      mime = "image/x-icon";
      break;
    case "svg":
      mime = "image/svg";
      break;
    default:
      mime = "image/unknown";
  }
  return `data:${mime};base64,${b64}`;
}
