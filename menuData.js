const { MenuList } = require('./src/index');
const fs = require('fs');
const path = require('path');

const menuData = async () => {
await MenuList.bulkCreate([
  {
    menuId: 1,
    menuName: '샐러드',
    menuCalorie: 1.2,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '샐러드.jpg')).toString('base64'),
    menuCarbo: 0.05,
    menuProtein: 0.01,
    menuFat: 0.1,
    menuGI: 22
  },
  {
    menuId: 2,
    menuName: '닭가슴살',
    menuCalorie: 1.1,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '2 닭가슴살.jpg')).toString('base64'),
    menuCarbo: 0,
    menuProtein: 0.23,
    menuFat: 0.012,
    menuGI: 45
  },
  {
    menuId: 3,
    menuName: '연어',
    menuCalorie: 1.6,
    menuImage: '',
    menuCarbo: 0,
    menuProtein: 0.2,
    menuFat: 0.06,
    menuGI: 47
  },
  {
    menuId: 4,
    menuName: '참치캔',
    menuCalorie: 1.1,
    menuImage: '',
    menuCarbo: 0.01,
    menuProtein: 0.26,
    menuFat: 0.01,
    menuGI: 40
  },
  {
    menuId: 5,
    menuName: '두부',
    menuCalorie: 0.95,
    menuImage: '',
    menuCarbo: 0.03,
    menuProtein: 0.09,
    menuFat: 0.05,
    menuGI: 42
  },
  {
    menuId: 6,
    menuName: '소고기(우둔살)',
    menuCalorie: 1.4,
    menuImage: '',
    menuCarbo: 0.0,
    menuProtein: 0.22,
    menuFat: 0.05,
    menuGI: 45
  },
  {
    menuId: 7,
    menuName: '돼지고기(뒷다리)',
    menuCalorie: 1.2,
    menuImage: '',
    menuCarbo: 0.0,
    menuProtein: 0.22,
    menuFat: 0.03,
    menuGI: 45
  },
  {
    menuId: 8,
    menuName: '삶은계란',
    menuCalorie: 1.56,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '17 삶은계란.jpg')).toString('base64'),
    menuCarbo: 0.012,
    menuProtein: 0.126,
    menuFat: 0.106,
    menuGI: 60
  },
  {
    menuId: 9,
    menuName: '사과',
    menuCalorie: 0.57,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '18 사과.jpg')).toString('base64'),
    menuCarbo: 0.114,
    menuProtein: 0.003,
    menuFat: 0.002,
    menuGI: 36
  },
  {
    menuId: 10,
    menuName: '바나나',
    menuCalorie: 0.9,
    menuImage: '',
    menuCarbo: 0.2,
    menuProtein: 0.01,
    menuFat: 0.004,
    menuGI: 55
  },
  {
    menuId: 11,
    menuName: '고구마',
    menuCalorie: 0.86,
    menuImage: '',
    menuCarbo: 0.17,
    menuProtein: 0.016,
    menuFat: 0.0,
    menuGI: 55
  },
  {
    menuId: 12,
    menuName: '아보카도',
    menuCalorie: 1.6,
    menuImage: '',
    menuCarbo: 0.02,
    menuProtein: 0.02,
    menuFat: 0.15,
    menuGI: 27
  },
  {
    menuId: 13,
    menuName: '저지방 우유',
    menuCalorie: 0.42,
    menuImage: '',
    menuCarbo: 0.05,
    menuProtein: 0.03,
    menuFat: 0.01,
    menuGI: 26
  },
  {
    menuId: 14,
    menuName: '블루베리',
    menuCalorie: 0.6,
    menuImage: '',
    menuCarbo: 0.12,
    menuProtein: 0.007,
    menuFat: 0.003,
    menuGI: 34
  },
  {
    menuId: 15,
    menuName: '토마토',
    menuCalorie: 0.2,
    menuImage: '',
    menuCarbo: 0.03,
    menuProtein: 0.01,
    menuFat: 0.002,
    menuGI: 30
  },
  {
    menuId: 16,
    menuName: '그릭 요거트',
    menuCalorie: 1.7,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '11 그릭 요거트.jpg')).toString('base64'),
    menuCarbo: 0.05,
    menuProtein: 0.11,
    menuFat: 0.09,
    menuGI: 11
  },
  {
    menuId: 17,
    menuName: '현미밥',
    menuCalorie: 1.53,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '19 현미밥.jpg')).toString('base64'),
    menuCarbo: 0.32,
    menuProtein: 0.03,
    menuFat: 0.007,
    menuGI: 56
  },
  {
    menuId: 18,
    menuName: '김치',
    menuCalorie: 0.2,
    menuImage: '',
    menuCarbo: 0.03,
    menuProtein: 0.017,
    menuFat: 0.002,
    menuGI: 15
  },
  {
    menuId: 19,
    menuName: '짜장면',
    menuCalorie: 1.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '짜장면.jpg')).toString('base64'),
    menuCarbo: 0.257,
    menuProtein: 0.06,
    menuFat: 0.04,
    menuGI: 80
  },
  {
    menuId: 38,
    menuName: '자장면',
    menuCalorie: 1.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '자장면.jpg')).toString('base64'),
    menuCarbo: 0.257,
    menuProtein: 0.06,
    menuFat: 0.04,
    menuGI: 80
  },
  {
    menuId: 20,
    menuName: '짬뽕',
    menuCalorie: 1.5,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '4 짬뽕.jpg')).toString('base64'),
    menuCarbo: 0.26,
    menuProtein: 0.06,
    menuFat: 0.024,
    menuGI: 73
  },
  {
    menuId: 21,
    menuName: '후라이드 치킨',
    menuCalorie: 2.8,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '5 후라이드 치킨.jpg')).toString('base64'),
    menuCarbo: 0.1,
    menuProtein: 0.24,
    menuFat: 0.22,
    menuGI: 74
  },
  {
    menuId: 22,
    menuName: '피자',
    menuCalorie: 2.6,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '6 피자.jpg')).toString('base64'),
    menuCarbo: 0.27,
    menuProtein: 0.09,
    menuFat: 0.1,
    menuGI: 60
  },
  {
    menuId: 23,
    menuName: '마라탕',
    menuCalorie: 0.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '7 마라탕.jpg')).toString('base64'),
    menuCarbo: 0.046,
    menuProtein: 0.04,
    menuFat: 0.036,
    menuGI: 40
  },
  {
    menuId: 24,
    menuName: '족발',
    menuCalorie: 2.3,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '8 족발.jpg')).toString('base64'),
    menuCarbo: 0.003,
    menuProtein: 0.2,
    menuFat: 0.16,
    menuGI: 5
  },
  {
    menuId: 25,
    menuName: '보쌈',
    menuCalorie: 2.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '9 보쌈.jpg')).toString('base64'),
    menuCarbo: 0.011,
    menuProtein: 0.14,
    menuFat: 0.25,
    menuGI: 27
  },
  {
    menuId: 26,
    menuName: '돈까스',
    menuCalorie: 2.8,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '10 돈까스.jpg')).toString('base64'),
    menuCarbo: 0.1,
    menuProtein: 0.2,
    menuFat: 0.15,
    menuGI: 60
  },
  {
    menuId: 27,
    menuName: '제육볶음',
    menuCalorie: 2.0,
    menuImage: '',
    menuCarbo: 0.09,
    menuProtein: 0.13,
    menuFat: 0.11,
    menuGI: 20
  },
  {
    menuId: 28,
    menuName: '부대찌개',
    menuCalorie: 1.56,
    menuImage: '',
    menuCarbo: 0.096,
    menuProtein: 0.07,
    menuFat: 0.096,
    menuGI: 35
  },
  {
    menuId: 29,
    menuName: '김치찌개',
    menuCalorie: 0.6,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '12 김치찌개.jpg')).toString('base64'),
    menuCarbo: 0.025,
    menuProtein: 0.04,
    menuFat: 0.04,
    menuGI: 30
  },
  {
    menuId: 30,
    menuName: '된장찌개',
    menuCalorie: 0.46,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '13 된장찌개.jpg')).toString('base64'),
    menuCarbo: 0.03,
    menuProtein: 0.035,
    menuFat: 0.017,
    menuGI: 30
  },
  {
    menuId: 31,
    menuName: '물냉면',
    menuCalorie: 1,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '14 물냉면.jpg')).toString('base64'),
    menuCarbo: 0.15,
    menuProtein: 0.04,
    menuFat: 0.014,
    menuGI: 59
  },
  {
    menuId: 32,
    menuName: '햄버거',
    menuCalorie: 2.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '15 햄버거.jpg')).toString('base64'),
    menuCarbo: 0.27,
    menuProtein: 0.16,
    menuFat: 0.12,
    menuGI: 66
  },
  {
    menuId: 33,
    menuName: '떡볶이',
    menuCalorie: 2.9,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '떡볶이.jpg')).toString('base64'),
    menuCarbo: 0.27,
    menuProtein: 0.035,
    menuFat: 0.015,
    menuGI: 87
  },
  {
    menuId: 34,
    menuName: '돼지국밥',
    menuCalorie: 1.53,
    menuImage: fs.readFileSync(path.join(__dirname, 'images', '20 돼지국밥.jpg')).toString('base64'),
    menuCarbo: 0.11,
    menuProtein: 0.138,
    menuFat: 0.052,
    menuGI: 70
  },
  {
    menuId: 35,
    menuName: '김밥',
    menuCalorie: 1.5,
    menuImage: '',
    menuCarbo: 0.23,
    menuProtein: 0.04,
    menuFat: 0.04,
    menuGI: 60
  },
  {
    menuId: 36,
    menuName: '삼겹살',
    menuCalorie: 3.3,
    menuCarbo: 0.006,
    menuProtein: 0.173,
    menuFat: 0.28,
    menuGI: 1
  },
  {
    menuId: 37,
    menuName: '베이글',
    menuCalorie: 2.8,
    menuImage: '',
    menuCarbo: 0.38,
    menuProtein: 0.16,
    menuFat: 0.07,
    menuGI: 75
  }


  ], { logging: false });
  console.log('MenuList added');
};

module.exports = menuData;
