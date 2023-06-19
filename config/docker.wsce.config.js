const password = process.env.PASSWORD;
const GBTlogin = {
        name: "log into Amex GBT using KeyCloak and take screenshot at the end",
        when: "after",
        run: async (_, page, url) => {
           console.log("typing in username.....");
           await page.type('#okta-signin-username', 'franklin.siler@sscinc.com');
           console.log("done typing username.");
           console.log("clicking continue....");
           await page.click("#okta-signin-submit2");
           console.log("done clicking continue.");
           console.log("waiting for KeyCloak username box")
           const keycloakLoginSelector = "#userNameInput";
           await page.waitForSelector(keycloakLoginSelector);
           console.log("found login box.  Now typing....");
           await page.type(keycloakLoginSelector, "ssnc-corp\\dt235813");
           await page.type("#passwordInput", password);
           console.log("typed login and password. Clicking the go button...");
           await page.click("#submitButton");
           console.log("clicked go.  Waiting on hamburger id to appear...");
           await page.waitForSelector("#hamburger");
           console.log("got hamburger id.");

           // take screenshot
           await page.waitForSelector("#close-support-container");
           await page.waitForSelector("article.slds-card.container");
           d = new Date(); ts = d.getTime();
           const filename = ts + "-test.png"
           console.log("starting screenshot" + filename + url);
           await page.screenshot({ path: filename})
           console.log("done taking screenshot.")
        },
}

const screenshot = {
        name: "Take a screenshot",
        when: "after",
        run: async (_, page, url) => {
                await new Promise(r => setTimeout(r, 2000));
                d = new Date(); ts = d.getTime();
                const filename = ts + "-test.png"
                console.log("starting screenshot" + filename + url);
                await page.screenshot({ path: filename})
                console.log("done taking screenshot.")
        },
}

module.exports = {
    scraper: {
//      urls: ["https://google.com", "https://ssctech.com", "https://www.fidelity.com", "https://franksiler.com"],
//      urls: ["https://jira.ssnc-corp.cloud"],
        urls: ["https://access.amexgbt.com/"],
        puppeteerOptions: { executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] },
        interval: 60_000,
//      forceRecreateBrowser: true,
        addons: [GBTlogin],
    },
    exporter: {
        port: 9924,
    },
};
