const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';

https.get(url, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      const BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';
      
      const bodyweight = data
        .filter(e => e.equipment === 'body weight' || e.equipment === 'assisted')
        .map(e => ({
          id: String(e.id),
          name: (e.name || '').toLowerCase().trim(),
          body_part: e.body_part || 'general',
          target: e.target || 'core',
          gif_url: e.gif_url ? (BASE + '/' + e.gif_url) : (BASE + '/videos/' + e.id + '-' + e.media_id + '.gif'),
          image_url: e.image ? (BASE + '/' + e.image) : (BASE + '/images/' + e.id + '-' + e.media_id + '.jpg'),
          instruction_steps: (e.instruction_steps && e.instruction_steps.en && Array.isArray(e.instruction_steps.en) && e.instruction_steps.en.length > 0)
            ? e.instruction_steps.en
            : (e.instructions && e.instructions.en)
              ? [e.instructions.en]
              : ['Maintain proper form and control through each repetition.']
        }));

      console.log('Processed ' + bodyweight.length + ' exercises.');
      const outPath = path.join(__dirname, '..', 'src', 'data', 'bodyweight_exercises.json');
      fs.writeFileSync(outPath, JSON.stringify(bodyweight, null, 2), 'utf8');
      console.log('Saved to ' + outPath + ' (' + fs.statSync(outPath).size + ' bytes)');
    } catch (err) {
      console.error('Error processing:', err);
    }
  });
}).on('error', err => console.error('Request error:', err));
