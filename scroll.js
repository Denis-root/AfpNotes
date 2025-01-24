const puppeteer = require("puppeteer");
const axios = require('axios');
const clipboard = require('node-clipboardy');
const fs = require('fs'); // Para guardar archivos
const path = require('path'); // Para manejar rutas de archivos
const FormData = require('form-data');
const { log } = require("console");


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
        return []; // Retornar un array vacío si hay un error
    }
    return []; // Retornar un array vacío si hay un error
}


async function downloadImages(imageUrls) {
    const downloadPromises = imageUrls.map(async (url) => {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const timestamp = Date.now();
            const fileName = `${timestamp}.jpg`;
            const filePath = path.resolve(__dirname, 'imgs', fileName);

            // Crear la carpeta 'imgs' si no existe
            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            // Guardar la imagen en el sistema de archivos
            fs.writeFileSync(filePath, response.data);
            console.log(`Imagen descargada: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error(`Error al descargar la imagen de ${url}:`, error.message);
            return null;
        }
    });

    // Esperar a que todas las descargas se completen
    const downloadedPaths = await Promise.all(downloadPromises);
    // Filtrar las descargas fallidas
    return downloadedPaths.filter(filePath => filePath !== null);
}

async function scrollAppContainer(page) {
    try {
        console.log(`scrollAppContainer`);

        // const xpath = '/html/body/app-root/app-connected-container/app-connected-space/app-main-page/div/div/app-actu-page/div/div/app-feed/div/div/div[1]/app-story';
        const xpath = '/html/body';

        // Esperar que el contenedor específico esté disponible
        await page.waitForXPath(xpath);

        // Seleccionar el contenedor
        const containerHandle = await page.$x(xpath);

        // Hacer scroll en el contenedor
        await containerHandle[0].evaluate(async (container) => {
            const distance = 100; // Distancia por cada scroll
            const delay = 100;    // Retraso entre cada scroll en ms

            while (container.scrollTop + container.clientHeight < container.scrollHeight) {
                console.log('Scrolling...');
                container.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        });
    } catch (error) {
        console.log(error);
    }
}

async function getHistories(page) {
    try {
        let attempt = 0;

        while (true) {
            console.log(`Intento ${attempt++} de obtener histories`);

            try {
                // Usa $x para seleccionar los nodos mediante XPath
                const elements = await page.$x('/html/body/app-root/app-connected-container/app-connected-space/app-main-page/div/div/app-actu-page/div/div/app-feed/div/div/div[1]/app-story');

                // Verifica si se encontraron elementos
                if (elements && elements.length > 0) {
                    console.log(`Se encontraron ${elements.length} elementos <app-story>.`);
                    return elements; // Devuelve la lista de elementos encontrados
                } else {
                    console.log('No se encontraron elementos <app-story>. Recargando...');
                }
            } catch (error) {
                console.error('Error al seleccionar los elementos <app-story>:', error);
            }

            // Recarga la página y espera para intentar de nuevo
            // await page.reload();
            // console.log('Página recargada. Esperando 30 segundos...');
            await sleepSeconds(10);
        }
    } catch (error) {
        console.error('Error inesperado en getHistories:', error);
    }
    return [];
}


async function scrollInfinite1(page) {
    try {
        console.log('Starting infinite scroll...');

        await page.evaluate(async () => {
            const distance = 100; // Distancia por cada scroll
            const delay = 500;   // Retraso entre cada scroll en ms
            let attempts = 0;    // Contador de intentos
            const maxAttempts = 50; // Máximo número de intentos para evitar loops infinitos

            while (attempts < maxAttempts) {
                const previousHeight = document.body.scrollHeight;

                // Scroll hacia abajo
                window.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));

                // Verificar si la altura del documento cambió
                const currentHeight = document.body.scrollHeight;

                if (currentHeight === previousHeight) {
                    // Si no hay más contenido cargado después de varios intentos, detener
                    attempts++;
                } else {
                    // Reiniciar los intentos si se cargó nuevo contenido
                    attempts = 0;
                }

            }

            console.log('Infinite scroll finished.');
        });
    } catch (error) {
        console.error('Error during infinite scroll:', error);
    }
}


async function scrollInfinite(page) {
    try {
        console.log('Starting infinite scroll...');

        const containerSelector = 'body > app-root > app-connected-container > app-connected-space > app-main-page > div > div > app-actu-page > div > div > app-feed > div.app-with-folders > div > div:nth-child(1)';

        await page.evaluate(async (containerSelector) => {
            const distance = 100; // Distancia por cada scroll
            const delay = 500;   // Retraso entre cada scroll en ms
            let previousChildCount = 0; // Número de hijos en la iteración anterior
            let attempts = 0;           // Contador de intentos sin cambios
            let x = 0;           // Contador de intentos sin cambios
            const maxAttempts = 40;     // Máximo número de intentos sin cambios

            while (attempts < maxAttempts) {
                // Obtener el contenedor
                const container = document.querySelector(containerSelector);

                // Contar los hijos actuales
                const currentChildCount = container ? container.querySelectorAll('app-story').length : 0;

                console.log({ currentChildCount });
                console.log({ previousChildCount });
                console.log({ attempts });

                // Desplazar hacia el último <app-story> si existe
                if (currentChildCount > 0) {
                    const stories = container.querySelectorAll('app-story');
                    const lastStory = stories[stories.length - 1]; // Último <app-story>

                    if (lastStory) {
                        lastStory.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
                    }
                }

                // Si la cantidad de hijos no cambia, incrementar los intentos
                if (currentChildCount === previousChildCount) {
                    attempts++;
                    console.log(`Intento ${x++} de obtener stories`);

                } else {
                    // Reiniciar intentos si se agregaron nuevos hijos
                    attempts = 0;
                    x = 0;
                }

                // Actualizar la cantidad previa de hijos
                previousChildCount = currentChildCount;

                // Realizar el scroll hacia abajo
                window.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            window.scrollTo(0, 0);
            console.log('Infinite scroll finished.');
        }, containerSelector);
    } catch (error) {
        console.error('Error during infinite scroll:', error);
    }

    console.log('Finished infinite scroll.');

}



async function scrollPage(page) {
    try {
        console.log('Scrolling the entire page...');

        await page.evaluate(async () => {
            const distance = 100; // Distancia por cada scroll
            const delay = 100;    // Retraso entre cada scroll en ms

            while (window.scrollY + window.innerHeight < document.body.scrollHeight) {
                console.log('Scrolling...');
                window.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        });

        console.log('Finished scrolling the page.');
    } catch (error) {
        console.log(error);
    }
}



async function sendPostRequest(url, data, filePaths) {
    try {
        const form = new FormData();
        form.append('title', data.title);
        form.append('note', data.note);

        // Adjuntar las imágenes como un array en el campo 'images[]'
        if (filePaths.length > 0) {
            filePaths.forEach((filePath) => {
                const fileStream = fs.createReadStream(filePath);
                form.append('images[]', fileStream); // Todas las imágenes en el campo 'images[]'
            });
        }

        // Enviar la solicitud POST con los headers generados por 'form-data'
        const response = await axios.post(url, form, {
            headers: form.getHeaders(),
        });

        console.log('Respuesta del servidor:', response.data);
    } catch (error) {
        console.error('Error al enviar los datos:', error.message);
        console.log(error);

    }
}



async function okCokiesDeMierda(page) {
    while (true) {
        try {
            const btnCookies = await page.waitForSelector('#onetrust-accept-btn-handler');
            await btnCookies.click();
        } catch (error) {
            // console.log(error);
        }
        await sleepSeconds(5);
    }
}




(async () => {


    const browser = await init();
    const page = await browser.newPage();
    await page.goto('https://news.afp.com');
    // await page.screenshot({ path: 'example.png' });

    try {
        const btnCookies = await page.waitForSelector('#onetrust-accept-btn-handler');
        await btnCookies.click();
    } catch (error) {
        console.log(error);
    }

    const inputUser = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[1]/lib-afp-textfield/div/div/input');
    await inputUser.type('ichavez@elmundo.sv', { delay: 100 });

    const inputPwd = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[2]/lib-afp-textfield/div/div/input');
    await inputPwd.type('93Icha%#', { delay: 100 });

    const btnOkLogin = await page.waitForXPath('/html/body/app-root/app-unconnected-container/app-authentification-container/app-login-page/div/div/div[1]/div/div/form/div[3]/lib-afp-button/div/button');
    await btnOkLogin.click();

    await sleepSeconds(30);

    okCokiesDeMierda(page);

    try {

        // await scrollInfinite(page);

        console.log(`Esperando 30 segundos`);
        await sleepSeconds(30);
        let stories = await getHistories(page) ?? [];

        console.log('stories', stories?.length);


        if (stories.length > 0) {

            for (const story of stories) {

                console.log('story: ', stories.length);

                await story.click(); // Hacer clic en cada <app-story>
                await page.waitForTimeout(1000); // Espera 1 segundo entre clics para simular comportamiento humano


                try {
                    // Obtener el botón de copiar y hacer clic
                    const btnCopy = await page.waitForXPath('/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page/app-viewer-container/div/div/app-action-bar/div[1]/div[1]/div[2]/lib-afp-icon-button/button');
                    await btnCopy.click();

                    await sleepSeconds(3);
                    await scrollAppContainer(
                        page,
                        '/html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page'
                    );

                    // Obtener las URLs de las imágenes
                    const urls = await getImages(page);

                    // Descargar las imágenes y obtener las rutas locales
                    const downloadedPaths = urls.length > 0 ? await downloadImages(urls) : []; // Si hay URLs, descarga; si no, paths es vacío.

                    // Leer el contenido del portapapeles y extraer el título
                    const clipboardContent = clipboard.readSync();
                    const title = clipboardContent.split('\n')[0].trim();
                    console.log('Primera línea limpia:', title);

                    // Preparar la URL para la petición
                    const urlMake = `https://hook.eu2.make.com/slvyhkr678gs1hikgavfqdheetln1qlr`;

                    const dataSheet = {
                        title,
                        note: clipboardContent,
                    };

                    await sendPostRequest(urlMake, dataSheet, downloadedPaths);

                } catch (error) {
                    console.log(error);
                }


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