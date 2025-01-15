const axios = require('axios');
const fs = require('fs');

async function downloadImage() {
    const url = 'https://ws-us.realptt.com/proxy/18.196.247.56:7782/api/media/getmedia';

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // Recibe datos binarios
            headers: {
                'Filepath': '2025/1/8/1276-83633121-23526-1736351134.jpg',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Orgid': '1276',
                'Accept': 'application/json, text/plain, */*',
                'Userid': '83635103',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                // 'Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODM2MzUxMDMiLCJtYWNfYWRkciI6IjBkOWRjNjZkLTU1MTgtNGZiMC04MTg3LTQ1MDFhMmE1NjU2MCIsIm9yZ19pZCI6IjEyNzYiLCJpc3MiOiJ6emRfcGF0cm9sIiwicHJpdmlsZWdlIjoiMCIsImV4cCI6MTczNjk2NzEyNSwiaWF0IjoxNzM2ODgwNzI1fQ.dm3qPfIUs4wuypeQNL-Ky8DbxjR7xGus-26p5Okg5_Y',
                'Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODM2MzUxMDMiLCJtYWNfYWRkciI6ImYzN2ZmOGRkLTAyYzUtNGYxOC1hYWY0LWYwZjM2M2YzMmRkNiIsIm9yZ19pZCI6IjEyNzYiLCJpc3MiOiJ6emRfcGF0cm9sIiwicHJpdmlsZWdlIjoiMCIsImV4cCI6MTczNjk4NTI4NSwiaWF0IjoxNzM2ODk4ODg1fQ.Bt4ipBD1jXLh6Nyob7grGNI--Lw5-F0uI-3Ez4lZqp8',
                'Origin': 'https://dispatcher.redptt.com',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://dispatcher.redptt.com/',
                'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                'Priority': 'u=1, i',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            },
        });

        // Extraer el nombre del archivo desde `Content-Disposition`
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'download.jpg'; // Nombre por defecto
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match && match[1]) {
                filename = match[1];
            }
        }

        // Guardar el archivo en el directorio actual
        fs.writeFileSync(filename, response.data);
        console.log(`Imagen descargada: ${filename}`);
    } catch (error) {
        console.error('Error descargando la imagen:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data.toString());
        }
    }
}

// Llama a la función para descargar la imagen
downloadImage();
