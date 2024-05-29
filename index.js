const { http } = require('@google-cloud/functions-framework')
const axios = require('axios')
const unzipper = require('unzipper')
const fs = require('fs')
const { Storage } = require('@google-cloud/storage')
const path = require('path');

const storage = new Storage({
  keyFilename: './charming-autumn-329804.json',
  projectId: 'charming-autumn-329804',
});

async function uploadFileToGCS(filePath, destination) {
  await storage.bucket('eva2-vfji').upload(filePath, {
    destination: `historico/${destination}`,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  console.log(`${filePath} uploaded to eva2-duoc-vfje/${destination}`);
}

http("get-data-montly", async (req, res) => {
  try {
    const response = await axios(
      {
        url: "https://www.dtpm.cl/descargas/gtfs/GTFS-V123-PO20240518.zip",
        method: "GET",
        responseType: 'stream'
      }
    );
    const tempFile = path.join('/tmp', 'temp_file.zip')


    console.log(tempFile);
    console.log(fs.existsSync(tempFile))
    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const directory = await unzipper.Open.file(tempFile);
    for (const file of directory.files) {
      const filePath = path.join('/tmp', file.path)
      console.log(filePath)
      console.log(fs.existsSync(filePath))
      await new Promise((resolve, reject) => {
        file.stream()
          .pipe(fs.createWriteStream(filePath))
          .on('finish', resolve)
          .on('error', reject);
      });
      await uploadFileToGCS(filePath, file.path);
      fs.rm
      fs.unlinkSync(filePath);
    }

    fs.unlinkSync(tempFile);
    res.send("ok")
  } catch (err) {
    console.log(err)
    res.sendStatus(400)
  }
});