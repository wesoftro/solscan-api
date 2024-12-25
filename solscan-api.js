const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 10000;

async function getTimiCapitalAmount() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://solscan.io/account/9YtrpbSVGFsduKPkNBXTdQpNQUcmTue1Yyh8Jxn6yunS', { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    await page.waitForSelector('div', { timeout: 5000 });

    const timiCapitalInfo = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const timiDiv = divs.find(div => 
        div.textContent.includes('(TIMI)') && 
        div.children.length === 0
      );
      
      if (timiDiv) {
        const timiMatch = timiDiv.textContent.match(/([\d,]+\.?\d*)/);
        const nextDiv = timiDiv.nextElementSibling;
        const nextDivMatch = nextDiv ? nextDiv.textContent.match(/([\d,]+\.?\d*)/): null;
        return {
          timiAmount: timiMatch ? timiMatch[1] : null,
          nextDivAmount: nextDivMatch ? nextDivMatch[1] : null
        };
      }
      return null;
    });

    if (timiCapitalInfo) {
    //   console.log('Suma Timi Capital (TIMI) găsită:', timiCapitalInfo.timiAmount);
    //   console.log('Suma din următorul div:', timiCapitalInfo.nextDivAmount);
    return {
        timiCurrentBallance: parseFloat(timiCapitalInfo.timiAmount.replace(/,/g, '')),
        usdCurrentBallance: parseFloat(timiCapitalInfo.nextDivAmount.replace(/,/g, ''))
    };
    } else {
      console.log('Nu s-a găsit informația despre Timi Capital (TIMI)');
    }
  } catch (error) {
    console.error('A apărut o eroare:', error);
  } finally {
    await browser.close();
  }
}

//Functie pentru a formata valorile in format B sau M in functie de valoare
function formatNumber(value) {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    } else {
      return value.toFixed(2);
    }
}

const https = require('https');
app.get('/test-external', (req, res) => {
  https.get('https://solscan.io', (response) => {
    res.send('Conexiune reușită la solscan.io');
  }).on('error', (e) => {
    res.status(500).send(`Eroare: ${e.message}`);
  });
});


app.get('/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

const timiInitialBallance = 303395897.13;
const usdInitialBallance = 45560715.65;

app.get('/api/timi-capital', async (req, res) => {
  try {
    const result = await getTimiCapitalAmount();
    if (result) {
      const usdCurrentBallance = result.usdCurrentBallance;
      const timiCurrentBallance = result.timiCurrentBallance;
      const usdDifference = usdInitialBallance - usdCurrentBallance;
      const usdPercentageDifference = ((usdDifference / usdInitialBallance) * 100).toFixed(2);
      const timiDifference = timiInitialBallance - timiCurrentBallance;
      const timiPercentageDifference = ((timiDifference / timiInitialBallance) * 100).toFixed(2);

      const finalResult = {
        ...result,
        timiInitialBallance,
        usdInitialBallance,
        usdDifference: usdDifference,
        timiDifference: timiDifference,
        timiPercentageDifference: parseFloat(timiPercentageDifference),
        usdPercentageDifference: parseFloat(usdPercentageDifference),
        usdCurrentBallanceFormatted: formatNumber(result.usdCurrentBallance)
      };
      res.json(finalResult);
    } else {
      res.status(404).json({ error: 'Nu s-a găsit informația despre Timi Capital (TIMI)' });
    }
  } catch (error) {
    console.error('A apărut o eroare:', error);
    res.status(500).json({ error: 'A apărut o eroare internă' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



// getTimiCapitalAmount().then(result => {
//     const usdCurrentBallance = result.usdCurrentBallance;
//     const timiCurrentBallance = result.timiCurrentBallance;
//     const usdDifference = usdInitialBallance - usdCurrentBallance;
//     const usdPercentageDifference = ((usdDifference / usdInitialBallance) * 100).toFixed(2);
//     const timiDifference = timiInitialBallance - timiCurrentBallance;
//     const timiPercentageDifference = ((timiDifference / timiInitialBallance) * 100).toFixed(2);
     

//     const finalResult = {
//         ...result,
//         timiInitialBallance,
//         usdInitialBallance,
//         usdDifference: usdDifference,
//         timiDifference: timiDifference,
//         timiPercentageDifference: parseFloat(timiPercentageDifference),
//         usdPercentageDifference: parseFloat(usdPercentageDifference),
//         usdCurrentBallanceFormatted: formatNumber(result.usdCurrentBallance)
//     };
//     console.log(JSON.stringify(finalResult, null, 2));
// });



// getTimiCapitalAmount().then(result => {
//     console.log(JSON.stringify(result, null, 2));
// });
// const data = getTimiCapitalAmount();
// console.log(JSON.stringify(data, null, 2));
