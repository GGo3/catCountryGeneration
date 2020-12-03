var express = require('express');
var router = express.Router();
var axios = require('axios');

// данные для страници

const countryDB = {
    table: '',
    loaderStat: `display:none;`,
    arrSidebar: ['africa', 'americas', 'asia', 'oceania', 'europe'],
    sidebarStr: '',
    cardHTML: ''
};

// фун-я  котороя отрисовавыет меню регионов, она нужна чтобы динамически менять значение checked при загрузки определенного региона

const genSidebar = (array, region) => {
    let str = '';
    array.forEach(element => {
        if (element !== region) {
            str = `${str}<p><input  type="radio" value="${element}">${element}</p>\n`;
        } else {
            str = `${str}<p><input  type="radio" value="${element}" checked>${element}</p>\n`;
        };
    });
    countryDB.sidebarStr = str;
};

// начальная страница на которой по дефолту выбрана Европа и страница пустая

router.get('/', (req, res, next) => {
    genSidebar(countryDB.arrSidebar, 'europe');
    res.render('index', countryDB);
});

// асинхронная функция которая парсит массив стран

const getCountry = async (continent) => {
    let temp = await axios.get(`https://restcountries.eu/rest/v2/region/${continent}`)
    let countryArr = temp.data.map(item => {
        return {
            countryName: item.name,
            countryFlag: item.flag,
            cats: []
        }
    });
    return countryArr
};

// асинхронная функция которая парсит ссылку на фото для породы кота по ид

const getCatUrl = async (id) => {
    let tempURL = await axios.get(`https://api.thecatapi.com/v1/images/search?breed_ids=${id}`);
    return tempURL.data[0].url
};

// асинхронная функция которая парсит массив котов и внутри добавляет для каждого кота ссылку на фото

const getCats = async () => {
    let temp = await axios.get('https://api.thecatapi.com/v1/breeds');
    let catsArr = temp.data.map(item => {
        return getCatUrl(item.id)
        .then((res) => {
            let tempObj = {
                catBreed: item.name,
                catCoutry: item.origin,
                catUrl: res,
            };
            return tempObj
        });
    });
    return Promise.all(catsArr);
};

// функция которая создает HTML карточек стран и ложит их в БД

const genCountryCard = (arr) =>{
    let countryCard = arr.reduce((str, current) => {
        let catsCard = current.cats.reduce((str2, current2) => {
            return `${str2}
            <div class="cat__card">\n
                <div class="cat__card-title">${current2.catBreed}</div>\n
                <img src="${current2.catUrl}" alt="${current2.catBreed}" class="cat__card-img">\n
            </div>\n`
        }, '');
        return `${str}
        <div class="coutry__card">\n
            <div class="coutry__header">\n
                <div class="coutry__card-title">${current.countryName}</div>\n
                <img src="${current.countryFlag}" alt="${current.countryName}" class="coutry__card-flag">\n
            </div>\n
            <div class="country__body">
                ${catsCard}
            </div>\n
        </div>\n`
    }, '');
    countryDB.cardHTML = countryCard;
};

// роутинг других регионов. Собираем 2 массива вместе и склеиваем в один, потом с полученного массива рисуем карточки

router.get('/:country', (req, res, next) => {
    genSidebar(countryDB.arrSidebar, req.params.country);
    Promise.all([getCountry(req.params.country), getCats()])
    .then(res => {
    const catsArr = res[1];
    const countryArr = res[0];
    let newArr = countryArr.filter(item => {
        let tempItem = null;
        catsArr.forEach(element => {
            if (item.countryName.includes(element.catCoutry)) {
                item.cats.push(element)
                tempItem = item;
            }
        });
        if(tempItem != null) {
            return tempItem
        };
    });
    genCountryCard(newArr);
    })
    .then(res3 => {
        res.render('index', countryDB)
    });
});

module.exports = router;