/*
Auditar la manera en que recibe las nuevas noticias
*/

const { chromium } = require('playwright-chromium');
const fs = require('fs'); // Para guardar archivos
const path = require('path'); // Para manejar rutas de archivos
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const timteTools = require('./tools/timeTools');

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


async function initBrowser() {
    let browser;
    try {
        browser = await chromium.launch({
            headless: false, // No headless (muestra la interfaz gráfica del navegador)
            // args: [], // Maximiza la ventana al iniciar
            args: ['--start-maximized', '--auto-open-devtools-for-tabs'] // Abre las DevTools automáticamente
        });

    } catch (error) {
        console.log(error);
    }
    return browser
}


async function getContext(browser) {
    let context = undefined;
    try {
        context = await browser.newContext({
            viewport: null, // Usa el tamaño completo de la ventana
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36', // User-Agent de un navegador real
        });
    } catch (error) {
        console.log(error);
    }
    return context;
}



async function loginAfp(page) {
    try {
        // Hace clic en el botón
        await page.click('#onetrust-accept-btn-handler');

        await page.type('[data-id="login_page_login_textfield"]', 'ichavez@elmundo.sv', { delay: 300 });
        await page.type('[data-id="login_page_password_textfield"]', '93Icha%#', { delay: 300 });
        await page.click('[data-id="login_page_submit_button"]');
    } catch (error) {

    }
    return page;
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

async function scrollInContainer(page, selector, timeout = 500) {
    const container = await page.$(selector); // Seleccionar el contenedor con el selector proporcionado

    if (!container) {
        console.error(`Contenedor no encontrado con el selector: ${selector}`);
        return;
    }

    let previousScrollTop = -1; // Posición inicial del scroll

    while (true) {
        const { scrollTop, scrollHeight, clientHeight } = await page.evaluate((container) => {
            // Obtener las propiedades necesarias para controlar el scroll
            return {
                scrollTop: container.scrollTop,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
            };
        }, container);

        // Verificar si el scroll ha llegado al final
        if (scrollTop + clientHeight >= scrollHeight || scrollTop === previousScrollTop) {
            console.log('Fin del scroll: no hay más contenido para cargar.');
            break;
        }

        // Desplazar hacia abajo
        await page.evaluate((container) => container.scrollBy(0, 200), container);

        // Actualizar la posición previa del scroll
        previousScrollTop = scrollTop;

        // Esperar antes de continuar con el siguiente scroll
        await page.waitForTimeout(timeout);
    }

    console.log('Scroll dentro del contenedor completado.');
}

async function getImages(page) {
    console.log(`
      Get Images
    `);

    try {
        console.log(`Esperando contenedor de fotos`);

        // Esperar que el contenedor principal esté cargado
        const containerSelector = 'app-related-content-block app-related-content app-media-wall div'; // Selector CSS equivalente al XPath proporcionado
        await page.waitForSelector(containerSelector);

        // Seleccionar el contenedor específico
        const containerHandle = await page.$(containerSelector);

        if (containerHandle) {
            // Dentro del contenedor, buscar las etiquetas <app-photo>
            const appPhotoHandles = await containerHandle.$$('app-photo'); // Selección directa dentro del contenedor

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
        console.error('Error al obtener las imágenes:', error);
        return []; // Retornar un array vacío si hay un error
    }

    return []; // Retornar un array vacío si no se encontraron imágenes
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


async function readStories(page) {

    await page.waitForSelector('.app-feed');

    await scrollInfinite(page);


    const containerSelector = '.app-feed'; // Selector del contenedor principal

    // Obtener todos los elementos <app-story> desde el primer hijo de app-feed
    const stories = await page.$$(`
        ${containerSelector} > :first-child app-story
    `) ?? []; // Selecciona todos los <app-story> del primer hijo del contenedor

    console.log('Stories:', stories.length);

    if (stories?.length == 0) {
        console.log(`No hay stories disponibles`);
        return;
    }

    // Iterar y hacer clic en cada <app-story>
    for (let i = 0; i < stories.length; i++) {
        console.log(`Haciendo clic en el story ${i + 1}`);

        try {
            // Hacer clic en el elemento actual
            await stories[i].click();

            // Esperar 5 segundos entre clics
            // await page.waitForTimeout(1000*60*3);
            await page.waitForTimeout(5000);

            await page.waitForSelector('.viewer-container');

            // Aquí puedes manipular cosas dentro del story actual
            // Por ejemplo, interactuar con contenido cargado dinámicamente:        
            let content = await page.evaluate(() => {
                const contentElement = document.querySelector('.viewer-container');
                if (!contentElement) return null; // Si no existe el contenedor, retornamos null

                // Objeto para almacenar los datos estructurados
                const result = {};

                // 1. Obtener el artículo desde `.story-header .header-infos-line`
                const articleElement = contentElement.querySelector('.story-header .header-infos-line');
                if (articleElement) {
                    const tag1Element = articleElement.querySelector('.colored-tag');
                    const tag2Element = articleElement.querySelector('.story-genre.ng-star-inserted');

                    result.articulo = {
                        tag1: tag1Element ? tag1Element.textContent.trim() : null,
                        tag2: tag2Element ? tag2Element.textContent.trim() : null,
                    };
                } else {
                    result.articulo = null;
                }

                // 2. Obtener el título desde `.story.copyTarget`
                const titleElement = contentElement.querySelector('.story.copyTarget');
                result.titulo = titleElement ? titleElement.textContent.trim() : null;

                // 3. Obtener la locación desde `.app-location-line.copyTarget.ng-star-inserted`
                const locationElement = contentElement.querySelector('.app-location-line.copyTarget.ng-star-inserted');
                result.locacion = locationElement ? locationElement.textContent.trim() : null;

                // 4. Obtener los tags desde `.tag-slugs.ng-star-inserted span`, eliminando duplicados
                const tagElements = contentElement.querySelectorAll('.tag-slugs.ng-star-inserted span');
                result.tags = Array.from(new Set(Array.from(tagElements).map(span => span.textContent.trim())));

                // 5. Obtener la nota desde `.narrow-container`
                const noteElement = contentElement.querySelector('.narrow-container');
                result.nota = noteElement ? noteElement.textContent.trim() : null;

                return result; // Retornamos el objeto con todos los datos estructurados
            });

            // await scrollInContainer(page, '//html/body/app-root/app-connected-container/app-connected-space/app-viewer/app-story-page', 500);
            await scrollInContainer(page, '.app-viewer app-story-page', 500);
            const imagesUrlsAfp = await getImages(page);
            // console.log({ imagesUrlsAfp });        
            // const pathImages = imagesUrlsAfp.length > 0 ? await downloadImages(imagesUrlsAfp) : []; // Si hay URLs, descarga; si no, paths es vacío.
            // console.log({pathImages});        
            content.images = imagesUrlsAfp;
            console.log({ content });
            console.log(`Contenido del story ${i + 1}:`);

            await page.click('[data-id="viewer_close_icon_button"]');
        } catch (error) {
            console.log(`Error al interactuar con el story ${i + 1}:`, error);
        }
    }

    console.log('Interacción con todos los stories completada.');
}


async function execApiGetStories(page, moreData) {
    const headersX = {
        'x-trace-id': uuidv4(),
        'x-span-id': uuidv4(),
        ...moreData
    };

    console.log({ headersX });


    // Inyectar el código para realizar la petición POST
    const response = await page.evaluate(async (headersCustom) => {
        console.log({ headersCustom });

        const url = 'https://hub-api-news.app.afp.com/search';
        const headers = {
            'Host': 'hub-api-news.app.afp.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://news.afp.com/',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + headersCustom.tokenBearer.trim(),
            'Origin': 'https://news.afp.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Te': 'trailers',
            "x-span-id": headersCustom['x-span-id'],
            "x-trace-id": headersCustom['x-trace-id']
        };

        let payload = {
            query: `query getStories (
                  $maxRows: Int,
                  $cursor: String,
                  $criteria: String,
                  $searchLanguage: String!,
                  $dateRange: DateRangeInput,
                  $userResearch: Boolean,
                  $getSelections: Boolean,
                  $sortOrder:String, $includedSub:Boolean, $language:[String!], $theme:[String!], $location:[String!], $country:[String!], $person:[String!], $textType:[String!], $wordCount:[String!], $provider:[String!]
                )
      {
        search:stories( maxRows: $maxRows,
                        cursor: $cursor,
                        criteria: $criteria,
                        searchLanguage: $searchLanguage,
                        dateRange: $dateRange,
                        wantedLanguages:$language,
                        userResearch: $userResearch,
                        getSelections: $getSelections,
                         sortOrder:$sortOrder, includedSub:$includedSub, language:$language, theme:$theme, location:$location, country:$country, person:$person, textType:$textType, wordCount:$wordCount, provider:$provider
                      )
        {
          docs {
           id
           type
           title
           selections
           country: countryname
           city
           guid
           contentCreated
           introduced
           dateToDisplay
           source
           notIncludedInSubscription
           genre
           isUrgent
           isAlert
           isFlash
           isPressRelease
           wordCount
           slug
           publicationDayWithUserTimezone: dayOfDateTodisplay (timezoneOffset:-360)
           cost
           provider_name
           contributor
           lang
           partner {
             gcp {
               providername
               provider_code
             }
           }
          }
          nextCursor
          hasMore
          numFound
        }
      }`,
            variables: {
                timezoneOffset: -360,
                maxRows: 40,
                searchLanguage: 'es',
                language: ['es'],
                getFacet: false,
                userResearch: false,
                getSelections: true,
            },
            operationName: 'getStories',
        };

        if (headersCustom.nextCursor !== undefined) {
            payload.variables.cursor = headersCustom.nextCursor;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            console.log({ res });

            return await res.json(); // Devolver el JSON de la respuesta
        } catch (error) {
            console.error('Error en la petición POST:', error);
            return { error: error.message };
        }
    }, headersX) ?? [];

    console.log('Respuesta de la API:', response);
    return response;
}

async function getCookies(context) {
    try {
        // Obtener todas las cookies del contexto actual
        return await context.cookies();
    } catch (error) {
        console.log(error);
    }
    return [];
}

const getTokenBearer = async (cookies) => {
    // Buscar la cookie específica 'ACCESS_TOKEN'
    const accessTokenCookie = cookies.find(cookie => cookie.name === 'ACCESS_TOKEN');

    if (accessTokenCookie) {
        console.log('ACCESS_TOKEN:', accessTokenCookie.value);
        return accessTokenCookie.value;
    } else {
        console.log('La cookie ACCESS_TOKEN no fue encontrada.');
    }
    return undefined;
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

const getStoriesApiLogical = async (page, tokenBearer) => {
    let allStories = new Map();
    let nextCursor = undefined;

    while (true) {
        try {
            let response = await execApiGetStories(page, { tokenBearer, nextCursor }) ?? {};
            let { docs, nextCursor: nextCurs, numFound, hasMore } = response?.data?.search;
            console.log({ nextCursor, hasMore });
            let antesDeAgregar = `Cantidad de notas antes de agregar: ${allStories.size}`;
            docs.forEach(doc => allStories.set(doc.id, doc));
            console.log(`${antesDeAgregar} || Cantidad de notas despues de agregar: ${allStories.size}`);
            nextCursor = nextCurs;

            // let conta = 0
            // for (const [key, value] of allStories) {
            //     console.log({ value });
            //     if (conta++ > 2) {
            //         break
            //     }
            // }
            // break;

            if (nextCurs) {
                //En teoria esto contiene nextCurs: "BEFORE 2025-01-11T00:50:48.000Z 2025-01-11T00:50:49Z"
                // Entonces tendria que resultar un array asi [BEFORE, 2025-01-11T00:50:48.000Z, 2025-01-11T00:50:49Z]   
                const cursorParts = nextCurs.split(' ') ?? []; // Dividir por espacios
                console.log({ cursorParts });


                if (cursorParts.length > 0) {
                    const convertedDate = timteTools.convertToTimezoneDate(cursorParts[1].trim())
                    const currentDate = timteTools.getCurrentDate(); // Fecha actual        

                    console.log({ convertedDate, currentDate });


                    if (convertedDate < currentDate) {
                        console.log('La fecha es pasada entonces BREAK!!!.');
                        break;
                    } else if (convertedDate === currentDate) {
                        console.log('La fecha es hoy.');
                    } else {
                        console.log('La fecha es futura.');
                    }

                }
            }
            await sleepSeconds(5);
        } catch (error) {
            console.log(error);
        }
    }

}

const onWssEvents = async (page) => {
    // Escuchar eventos WebSocket
    page.on('websocket', (ws) => {
        console.log('WebSocket conectado:', ws.url());

        // Escuchar mensajes recibidos desde el servidor
        ws.on('framereceived', (frame) => {
            // console.log('Mensaje recibido:', frame.payload); // Mostrar el mensaje recibido
            try {
                console.log('Mensaje recibido:', JSON.parse(frame.payload)); // Mostrar el mensaje recibido
            } catch (error) {

            }
        });

        // Escuchar mensajes enviados desde la página
        ws.on('framesent', (frame) => {
            // console.log('Mensaje enviado:', frame.payload); // Mostrar el mensaje enviado
        });
    });

    console.log('Esperando mensajes de WebSocket...');
}

async function logicalProgression() {
    // Lanza el navegador en modo no headless con opciones para maximizar la ventana
    const browser = await initBrowser();

    // Crea un contexto de navegación
    const context = await getContext(browser);

    // Crea una nueva página dentro del contexto
    const page = await context.newPage();

    // Navega a la URL deseada
    await page.goto('https://news.afp.com');

    onWssEvents(page);

    //Cookies de mierda
    // Espera a que el botón exista en el DOM
    try {
        await page.waitForSelector('#onetrust-accept-btn-handler', { state: 'visible' });
    } catch (error) {
    }

    await loginAfp(page);

    // await readStories(page);

    console.log(`Esperando 30 segundos a que carguen las cookies`);
    await sleepSeconds(30);

    let cookies = await getCookies(context);


    if (cookies.length > 0) {
        console.log(`Cantidada de cookings souls: ${cookies.length}`);

        // Buscar la cookie específica 'ACCESS_TOKEN'
        let tokenBearer = await getTokenBearer(cookies);

        if (tokenBearer !== undefined) {
            await getStoriesApiLogical(page, tokenBearer);
            // await execApiGetStories(page, tokenBearer);
        }

    }


    // Cierra el navegador
    // await browser.close();
}

(async () => {
    await logicalProgression();
})();