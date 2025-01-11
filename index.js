const puppeteer = require("puppeteer");
const axios = require('axios');
const clipboard = require('node-clipboardy');
const fs = require('fs'); // Para guardar archivos
const path = require('path'); // Para manejar rutas de archivos

let clipboardy;

console.log(`
@@@@@@@@   @@@@@@   @@@@@@@@@@   @@@  @@@  @@@@@@@@@@    @@@@@@   @@@@@@@@  @@@  @@@  
@@@@@@@@  @@@@@@@@  @@@@@@@@@@@  @@@  @@@  @@@@@@@@@@@  @@@@@@@@  @@@@@@@@  @@@  @@@  
     @@!  @@!  @@@  @@! @@! @@!  @@!  @@@  @@! @@! @@!  @@!  @@@  @@!       @@!  @@@  
    !@!   !@!  @!@  !@! !@! !@!  !@!  @!@  !@! !@! !@!  !@!  @!@  !@!       !@!  @!@  
   @!!    @!@!@!@!  @!! !!@ @!@  @!@  !@!  @!! !!@ @!@  @!@!@!@!  @!!!:!    @!@  !@!  
  !!!     !!!@!!!!  !@!   ! !@!  !@!  !!!  !@!   ! !@!  !!!@!!!!  !!!!!:    !@!  !!!  
 !!:      !!:  !!!  !!:     !!:  !!:  !!!  !!:     !!:  !!:  !!!  !!:       !!:  !!!  
:!:       :!:  !:!  :!:     :!:  :!:  !:!  :!:     :!:  :!:  !:!  :!:       :!:  !:!  
 :: ::::  ::   :::  :::     ::   ::::: ::  :::     ::   ::   :::   ::       ::::: ::  
: :: : :   :   : :   :      :     : :  :    :      :     :   : :   :         : :  :  ©      
    `);



async function getClipboardContent() {
    try {
        const content = await clipboardy.read(); // Lee el contenido del portapapeles
        console.log('Contenido del portapapeles:', content);
        return content; // Retorna el contenido como una variable
    } catch (error) {
        console.error('Error al leer el portapapeles:', error.message);
        throw error;
    }
}

async function sendPostRequest(url, data) {
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Respuesta del servidor:', response.data);
        return response.data; // Retorna la respuesta del servidor
    } catch (error) {
        console.error('Error en la solicitud POST:', error.message);
        throw error; // Relanza el error para que sea manejado externamente si es necesario
    }
}

async function init() {
    try {
        // Lanzamos un nuevo navegador.
        // const browser = await puppeteer.launch();
        browser = await puppeteer.launch({
            defaultViewport: null,  // Establece el viewport predeterminado en null para permitir que el navegador lo controle
            args: ['--start-maximized'],  // Inicia Chrome en modo maximizado
            headless: false, // Especificamos que el navegador no es headless
            slowMo: 100, // Añadimos un delay de 1 segundo entre cada comando.
            // userDataDir: './my-session-data'
        });

        // await goToConsultas(page);
        // await sleep(120000);
        // await sleep(30000);

        // await browser.close();

    } catch (error) {
        console.log(error);
    }
    return browser
}

function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepSeconds(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Función para pausar en minutos
function sleepMinutes(minutes) {
    return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}


async function getImages(page) {
    console.log(`
        Get IMages
        `);

    try {

        console.log(`Esperrando contenedor de fotos`);

        // Esperar que el contenedor principal esté cargado
        const containerXPath = '/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page/app-viewer-container/div/div/div/div/app-related-content-block/div/div/div/app-related-content/div/app-media-wall/div';
        await page.waitForXPath(containerXPath);

        // Seleccionar el contenedor específico
        const containerHandle = await page.$x(containerXPath);

        if (containerHandle.length > 0) {
            // Dentro del contenedor, buscar las etiquetas <app-photo>
            const appPhotoHandles = await containerHandle[0].$$('app-photo'); // Selección directa dentro del contenedor

            const imageUrls = [];
            for (const appPhotoHandle of appPhotoHandles) {
                // Evaluar cada <app-photo> para obtener el atributo src del <img>
                const imageUrl = await appPhotoHandle.evaluate((appPhoto) => {
                    const imgElement = appPhoto.querySelector('div.photo-container img'); // Buscar el <img> dentro de .photo-container
                    return imgElement ? imgElement.src : null; // Retornar el src o null si no existe
                });

                if (imageUrl) {
                    imageUrls.push(imageUrl); // Agregar el enlace al array si existe
                }
            }

            return imageUrls; // Retornar el array de enlaces de imágenes

        } else {
            console.error('No se encontró el contenedor.');
        }

    } catch (error) {
        console.log(error);

    }
}

async function downloadFile(imageUrls) {
    try {

        console.log(`downloadFile`);

        let imgPaths = [];

        // Ruta a la carpeta donde se guardarán las imágenes
        const outputDir = path.resolve(__dirname, 'imgs');

        // Crear la carpeta si no existe
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Carpeta creada: ${outputDir}`);
        }

        // Descargar cada imagen usando Axios
        for (const url of imageUrls) {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });

                // Nombre del archivo basado en el timestamp Unix
                const timestamp = Date.now();
                const filePath = path.resolve(outputDir, `${timestamp}.jpg`);

                // Guardar la imagen en el sistema
                fs.writeFileSync(filePath, response.data);

                imgPaths.push(filePath);

                console.log(`Imagen descargada: ${filePath}`);
            } catch (error) {
                console.error(`Error al descargar la imagen de ${url}:`, error.message);
            }
        }

        return imgPaths; // Retornar la ruta de las imágenes descargadas
    } catch (error) {
        console.error('Error en downloadFile:', error.message);
    }
}


async function scrollAppContainer(page) {
    try {
        console.log(`scrollAppContainer`);

        // Esperar que el contenedor específico esté disponible
        await page.waitForXPath('/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page');

        // Seleccionar el contenedor
        const containerHandle = await page.$x('/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page');

        // Hacer scroll en el contenedor
        await containerHandle[0].evaluate(async (container) => {
            const distance = 100; // Distancia por cada scroll
            const delay = 100;    // Retraso entre cada scroll en ms

            while (container.scrollTop + container.clientHeight < container.scrollHeight) {
                container.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        });
    } catch (error) {
        console.log(error);
    }
}



(async () => {


    const browser = await init();
    const page = await browser.newPage();
    await page.goto('https://news.afp.com');
    // await page.screenshot({ path: 'example.png' });
    const inputUser = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[1]/lib-afp-textfield/div/div/input');
    await inputUser.type('ichavez@elmundo.sv', { delay: 100 });

    const inputPwd = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[2]/lib-afp-textfield/div/div/input');
    await inputPwd.type('93Icha%#', { delay: 100 });

    const btnOkLogin = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[3]/lib-afp-button/div/button');
    await btnOkLogin.click();

    await sleepSeconds(10);

    try {

        let stories = undefined;
        let conta = 0;
        while (true) {
            console.log(`Intento ${conta++} de obtener histories`);

            try {
                // Selecciona todos los elementos hijos <app-story> dentro del contenedor dado
                stories = await page.$x('/html/body/app-root/app-connected-container/app-connected-space/app-main-page/div/div/app-actu-page/div/div/app-feed/div/div/div[1]/app-story');
                break;
            } catch (error) {
                console.error('Error al seleccionar los elementos <app-story>:', error);
                // await sleepSeconds(5);
                await page.reload();
                await sleepSeconds(30)
            }
        }

        console.log('stories', stories.length);

        if (stories.length > 0) {

            for (const story of stories) {

                console.log('story: ', stories.length);

                await story.click(); // Hacer clic en cada <app-story>
                await page.waitForTimeout(1000); // Espera 1 segundo entre clics para simular comportamiento humano

                try {
                    const btnCopy = await page.waitForXPath('/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page/app-viewer-container/div/div/app-action-bar/div[1]/div[1]/div[2]/lib-afp-icon-button/button');
                    await btnCopy.click();


                    const clipboardContent = clipboard.readSync();
                    const title = clipboardContent.split('\n')[0].trim();
                    console.log('Primera línea limpia:', title);
                    const urlMake = `https://hook.eu2.make.com/0uk66pbkhxumj4ykfyndq77ugvn8ejtq`;
                    const dataSheet = {
                        title,
                        note: clipboardContent
                    }

                    try {
                        const resultado = await sendPostRequest(urlMake, dataSheet);
                        console.log('Resultado:', resultado);
                    } catch (error) {
                        console.error('Error al enviar los datos:', error);
                    }

                } catch (error) {
                    console.log(error);
                }

                await sleepSeconds(10);
                await scrollAppContainer(page);
                const urls = await getImages(page);
                const paths = downloadFile(urls);

                await sleepSeconds(5);
            }
        } else {
            console.error('No se encontraron elementos <app-story>');
        }

    } catch (error) {
        console.log(error);
    }

    // await browser.close();
})()