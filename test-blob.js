require('dotenv').config({ path: '.env' });
const { put } = require('@vercel/blob');

async function upload() {
  try {
    const textBlob = new Blob(['Hello, world!'], { type: 'text/plain' });
    const file = new File([textBlob], 'hello.txt', { type: 'text/plain' });
    const result = await put(file.name, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
    console.log("Success:", result);
  } catch(e) {
    console.error("Error:", e.message);
  }
}

upload();
