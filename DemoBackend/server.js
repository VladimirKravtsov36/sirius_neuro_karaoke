const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Тестовые треки
const tracks = [
  { id: '1', title: 'Shape of You', artist: 'Ed Sheeran', coverUrl: 'https://i.ytimg.com/vi/ts05cwj7-98/maxresdefault.jpg' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', coverUrl: 'https://i.ytimg.com/vi/ts05cwj7-98/maxresdefault.jpg' },
];

// Поиск
app.get('/api/search', (req, res) => {
  const query = req.query.query || '';
  console.log('Search query:', query);
  const results = tracks; // можно фильтровать по query
  res.json(results);
});

// POST /process/:trackId
app.post('/process/:trackId', (req, res) => {
  const trackId = req.params.trackId;
  const track = tracks.find(t => t.id === trackId);
  if (!track) return res.status(404).json({ status: 'error', message: 'Track not found' });

  const baseUrl = `http://localhost:${PORT}/downloads/${trackId}`;

  // Загружаем karaokeData из json файла, если есть, иначе используем заглушку
  const karaokeFile = path.join(__dirname, 'downloads', trackId, 'karaoke.json');
  let karaokeData = [];
  if (fs.existsSync(karaokeFile)) {
    karaokeData = JSON.parse(fs.readFileSync(karaokeFile, 'utf-8'));
  } else {
    // Пример заглушки
    karaokeData = [
      {
        start: 0.0,
        end: 3.0,
        text: "Sample lyrics",
        words: [
          { word: "Sample", start: 0.0, end: 1.0, score: 1 },
          { word: "lyrics", start: 1.0, end: 3.0, score: 1 },
        ]
      }
    ];
  }

  res.json({
    status: 'success',
    track_info: { title: track.title, artist: track.artist },
    analysis: { key: 'C#m' },
    downloads: {
      vocals_url: `${baseUrl}/vocals.mp3`,
      instrumental_url: `${baseUrl}/instrumental.mp3`,
      images_url: `${baseUrl}/images`,
      images_count: '3',
    },
    karaokeData,
  });
});

// Раздача статики
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

//const path = require('path');
app.get('/downloads/:trackId/images', (req, res) => {
  const trackId = req.params.trackId;
  const imagesDir = path.join(__dirname, 'downloads', trackId, 'images');

  fs.readdir(imagesDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Не удалось прочитать папку' });

    const baseUrl = `http://localhost:${PORT}/downloads/${trackId}/images`;

    const images = files
      .filter((file) => /\.(jpe?g|png|gif)$/i.test(file) && !file.startsWith('.'))
      .map((file) => `${baseUrl}/${file}`);

    res.json({ images });
  });
});


// Запуск сервера
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
