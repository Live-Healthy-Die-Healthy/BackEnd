const { ExerciseList } = require('./src/index');
const fs = require('fs');
const path = require('path');

const loadExerciseData = async () => {
  try {
    await ExerciseList.bulkCreate([
      {
        exerciseName: '팔굽혀펴기',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Push Up.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '조깅',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Jogging.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '스쿼트',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Squats.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '사이클',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Cycling.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '턱걸이',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Pull Up.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '바벨 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'babel-curl.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '바벨 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'babel-row.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '벤치 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'benchPress.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '케이블 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'cable-row.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '카프레이즈',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'calf-raise.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '데드리프트',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'deadlift.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '딥스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'dips.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '덤벨 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'dumbel-curl.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '플라이',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'fly.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '바벨 풀오버',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'full-over.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '랫 풀 다운',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'lat-pull-down.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '레그 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'leg-press.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '라잉 트라이셉스 익스텐션',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'lying-triceps-extensions.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '밀리터리 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'military-press.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '사이드 래터럴 레이즈',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'side-lateral-raise.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '트라이셉스 푸쉬 다운',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'trisebs-push-down.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '등산',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '등산.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '수영',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '수영.jpg')),
        exercisePart: 'AerobicExercise',
      },{
        exerciseName: '업라이트 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '업라이트 로우.jpg')),
        exercisePart: 'shoulder',
      },{
        exerciseName: '축구',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '축구.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '걷기',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '걷기.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '농구',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '농구.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '디클라인 벤치 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '디클라인 벤치 프레스.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '런지',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '런지.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '레그 익스텐션',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '레그 익스텐션.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '배드민턴',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '배드민턴.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '밴드 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '밴드 로우.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '버터플라이 머신',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '버터플라이 머신.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '벤트오버 래터럴 레이즈',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '벤트오버 레터럴 레이즈.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '비하인드 넥 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '비하인드 넥 프레스.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '숄더 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '숄더 프레스.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '시티드 레그 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '시티드 레그 프레스.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '시티드 레그 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '시티드 레그컬.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '시티드 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '시티드 로우.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '아놀드 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '아놀드 프레스.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '에어로빅',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '에어로빅.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '요가',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '요가.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '인클라인 벤치 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '인클라인 벤치 프레스.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '줄넘기',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '줄넘기.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '케이블 크로스 오버',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '케이블 크로스 오버.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '킥 백',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '킥 백.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '탁구',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '탁구.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '테니스',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '테니스.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: '티바 로우',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '티바 로우.jpg')),
        exercisePart: 'back',
      },
      {
        exerciseName: '페이스 풀',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '페이스 풀.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '펙덱 플라이 머신',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '펙덱 플라이 머신.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '푸시 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '푸시 프레스.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '프레스 다운',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '프레스 다운.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '프론 레그컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '프론 레그컬.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '프론트 레이즈',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '프론트 레이즈.jpg')),
        exercisePart: 'shoulder',
      },
      {
        exerciseName: '프리쳐 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '프리쳐 컬.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '해머 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '해머 컬.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '힙 어브덕션',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '힙 어브덕션.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: '데드버그',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '데드버그.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '러시안 트위스트',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '러시안 트위스트.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '레그 레이즈',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '레그 레이즈.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '리버스 플랭크',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '리버스 플랭크.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '마운틴 클라이머',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '마운틴 클라이머.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '버드독',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '버드독.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '버터플라이 싯 업',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '버터플라이 싯 업.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '사이드 플랭크',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '사이드 플랭크.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '시티드 니업',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '시티드 니업.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '윗몸일으키기',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '윗몸일으키기.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '트위스트 플랭크',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '트위스트 플랭크.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '플랭크',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '플랭크.jpg')),
        exercisePart: 'core',
      },
      {
        exerciseName: '리버스 컬',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '리버스 컬.jpg')),
        exercisePart: 'arm',
      },
      {
        exerciseName: '체스트 프레스',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '체스트 프레스.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '파이크 푸쉬업',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '파이크 푸쉬업.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '와이드 푸쉬업',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '와이드 푸쉬업.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: '내로우 푸쉬업',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', '내로우 푸쉬업.jpg')),
        exercisePart: 'chest',
      }

    ], { logging: false });
    console.log('ExerciseList added');
  } catch (error) {
    console.error('Error adding ExerciseList:', error);
  }
};

module.exports = loadExerciseData;
