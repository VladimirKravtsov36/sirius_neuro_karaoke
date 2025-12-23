const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// тестовые данные
const tracks = [
  { id: '1', title: 'Shape of You', artist: 'Ed Sheeran', coverUrl: 'https://via.placeholder.com/150' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', coverUrl: 'https://via.placeholder.com/150' },
  { id: '3', title: 'Bad Guy', artist: 'Billie Eilish', coverUrl: 'https://via.placeholder.com/150' },
  { id: '4', title: 'Levitating', artist: 'Dua Lipa', coverUrl: 'https://via.placeholder.com/150' },
  { id: '5', title: 'Stay', artist: 'The Kid LAROI', coverUrl: 'https://via.placeholder.com/150' },
  { id: '6', title: 'Peaches', artist: 'Justin Bieber', coverUrl: 'https://via.placeholder.com/150' },
  { id: '7', title: 'Watermelon Sugar', artist: 'Harry Styles', coverUrl: 'https://via.placeholder.com/150' },
  { id: '8', title: 'Drivers License', artist: 'Olivia Rodrigo', coverUrl: 'https://via.placeholder.com/150' },
];

// функция для случайного выбора N элементов
function getRandomTracks(arr, n) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// эндпоинт поиска
app.get('/api/search', (req, res) => {
  const query = req.query.query || '';
  console.log('Search query:', query);

  const randomTracks = getRandomTracks(tracks, 5);
  res.json(randomTracks);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
