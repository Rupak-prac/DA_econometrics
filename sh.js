const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrap() {
    const browser = await puppeteer.launch({ devtools: true });
    const page = await browser.newPage();


    const data = []

    for (let pg = 1; pg < 5 ; pg++) {
        let url=""
        if(pg===1){
            url = `https://www.etuovi.com/myytavat-asunnot/ylivieska?haku=M2223155701`;
        } else {
            url = `https://www.etuovi.com/myytavat-asunnot/ylivieska?haku=M2223155701&sivu=${pg}`;
        }

        await page.goto(url, {
            waitUntil: 'networkidle0'
        });

        // const t = await page.title();
        // console.log(t)

        await page.waitForSelector('.kfALKRz', { timeout: 60000 });
        await page.waitForSelector('img', { timeout: 60000 });

        const homes = await page.evaluate(() => {
            const homeContainer = document.querySelectorAll('.kfALKRz');
            return Array.from(homeContainer).map((eachCont) => {
                const trSelect = eachCont.querySelector('h5')
                const typeRooms = trSelect ? trSelect.innerText : '';
                const trArr = typeRooms.split('|').map(el => el.trim());
                const hType = trArr[0];
                const roomsInfo = trArr.length > 1 ? trArr[1] : '';

                const splitedRooms = roomsInfo.replaceAll('+', ',').split(',').map(el => el.trim()) // returns [ '3h', 'k', 'wc', 'ph', 's' ]
                const rooms = parseInt(splitedRooms[0])
                const sauna = ['s', 'sauna', 'S', 'Sauna', 'SAUNA'].some(item => splitedRooms.includes(item));
                //const parveke = ['PARV','Parv.','parv', 'parv.', 'lasi.parv','lasitettu parveke'].some(item => splitedRooms.includes(item));


                const osSelect = eachCont.querySelector('h4')
                const osoite = osSelect ? osSelect.innerText : ''; // if selected h4 exist, then innetText is value else empty string
                const spAr = osoite.split(',').map(el => el.trim())
                const len = spAr.length // either there will be 2 or 3 elements in the spAr
                const city = spAr[len - 1] // city is usually last element of the spAr whether its len of 2 or 3
                const region = spAr.length === 3 ? spAr[1] : null;
                const street = spAr.length > 1 ? spAr[0] : null;


                const prArYrSelect = eachCont.querySelectorAll('h6 + span') // span just after h6 . There are about 3 
                const price = prArYrSelect[0] ? parseInt(prArYrSelect[0].innerText) * 1000 : null;
                const area = prArYrSelect[1] ? parseFloat(prArYrSelect[1].innerText.replace(',', '.')) : null; //replace , with . and turnd to float
                const year = prArYrSelect[2] ? prArYrSelect[2].innerText : null;

                // const areaSelect = eachCont.querySelectorAll('h6 + span')[1]
                // const area = areaSelect ? areaSelect.innerText: null;
                // const yrSelect = eachCont.querySelectorAll('h6 + span')[2]

                const comSelect = eachCont.querySelector('#item-office img')
                const seller = comSelect ? comSelect.getAttribute('alt') : null;

                return { hType, rooms, sauna, price, area, year, city, region, street, seller }
            })
        });
        
        data.push(...homes)
        console.log('workign at page'+pg)
    }
    fs.writeFileSync('homeData_ylv.json', JSON.stringify(data, null, 2))
    console.log('data saved')
    await browser.close();
}

scrap()