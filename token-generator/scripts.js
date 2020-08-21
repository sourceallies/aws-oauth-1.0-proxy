const fetch = require("node-fetch");
// const electron = require("electron");
// const BrowserWindow = electron.BrowserWindow;

const settings = {
  awsProxyUrl: "https://xpvd7akwci.execute-api.us-east-1.amazonaws.com/Prod",
  uiFrontendUrl: "http://dev.agpoint.sourceallies.com/",
};

function getFirstLegToken(awsProxyUrl, uiFrontendUrl) {
  let firstLegToken;
  fetch(`${awsProxyUrl}/firstLegAuth?oauth_callback=${uiFrontendUrl}`, {
    method: "post",
  })
    .then((res) => res.json())
    .then((json) => {
      firstLegToken = json;
    });
  return firstLegToken;
}

const firstLegToken = getFirstLegToken(
  settings.awsProxyUrl,
  settings.uiFrontendUrl
);
