const sharp = require('sharp');
const path = require('path');

class Resize {
  constructor(folder) {
    this.folder = folder;
  }
  async save(buffer, name) {
    const filename = Resize.filename(name);
    const filepath = this.filepath(filename);

    await sharp(buffer)
      .resize(300, 300, { // size image 300x300
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .toFile(filepath);
    
    return filename;
  }
  static filename(name) {
     // random file name
    return name+`.png`;
  }
  filepath(filename) {
    return path.resolve(`${this.folder}/${filename}`)
  }
}
module.exports = Resize;