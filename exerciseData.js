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
      
    ], { logging: false });
    console.log('ExerciseList added');
  } catch (error) {
    console.error('Error adding ExerciseList:', error);
  }
};

module.exports = loadExerciseData;
