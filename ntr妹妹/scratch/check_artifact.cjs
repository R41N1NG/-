const fs = require('fs');

const p = 'C:/Users/11944/.gemini/antigravity/brain/1bc0473f-e1e5-4a33-9fb2-eaa2fdf68b6f/status_bar_preview.html';
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf8');
  console.log('Artifact status_bar_preview.html length:', content.length);
  if (content.includes('心相底模')) {
    console.log('Artifact has 心相底模!');
  } else {
    console.log('Artifact does not have 心相底模');
  }
}
