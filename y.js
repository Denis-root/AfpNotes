const axios = require('axios');


function parseCookies(setCookieArray) {
    const cookies = {};
    if (!setCookieArray) return cookies;

    setCookieArray.forEach(cookieString => {
        const [cookiePart] = cookieString.split(';'); // Toma solo la parte antes del ';'
        const [name, value] = cookiePart.split('='); // Divide en nombre y valor
        cookies[name.trim()] = value ? value.trim() : '';
    });

    return cookies;
}


async function fetchDataGet(url) {
    try {
        // Configuración de la petición
        const config = {
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            },
            withCredentials: true, // Para permitir el manejo de cookies
        };

        // Haciendo la petición
        const response = await axios(config);

        // Mostrando el resultado
        // console.log('Data:', response.data); // Datos de la respuesta
        // console.log('Cookies:', response.headers['set-cookie'] || 'No cookies found'); // Cookies devueltas
        // console.log('Headers:', response.headers); // Headers completos

        return {
            data: response.data,
            cookies: response.headers['set-cookie'] || 'No cookies found',
            headers: response.headers
        }
    } catch (error) {
        console.error('Error en la petición:', error.message);
    }
}


async function fetchDataPost(url, payload) {
    try {
        // Configuración de la petición
        const config = {
            method: 'POST',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json', // Especifica que el cuerpo es JSON
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            },
            data: payload, // Los datos en formato JSON
            withCredentials: true, // Para permitir el manejo de cookies
        };

        // Haciendo la petición
        const response = await axios(config);

        // Retornando los resultados
        return {
            data: response.data, // Datos de la respuesta
            cookies: response.headers['set-cookie'] || 'No cookies found', // Cookies devueltas
            headers: response.headers // Headers completos
        };
    } catch (error) {
        console.error('Error en la petición:', error.message);

        // Devuelve más información sobre el error si está disponible
        if (error.response) {
            return {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            };
        }
    }
}



(async () => {
    // Llamando a la función
    // let { data, cookies } = await fetchDataGet('https://api.realptt.com/ptt/random');
    // console.log({ data, cookies });
    // let cookieParses = parseCookies(cookies);
    // console.log({ cookieParses });
    // console.log(cookieParses.JSESSIONID);

    // //https://api.realptt.com/ptt/organization;jsessionid=B996BB20D0B1E2D40A80A73495CDCC48?method=login&operation=pc&pwd=c21591fe042411cfce53a0c52a539fcda3e9efab&orgId=1276&account=151899&timeZoneOffset=360
    // let jsessionid = cookieParses.JSESSIONID;
    let pwd = 'c21591fe042411cfce53a0c52a539fcda3e9efab';
    let orgId = '1276';
    let account = '151899';
    let timeZoneOffset = '360';

    // let urlLogin = `https://api.realptt.com/ptt/organization;jsessionid=${jsessionid}?method=login&operation=pc&pwd=${pwd}&orgId=${orgId}&account=${account}&timeZoneOffset=${timeZoneOffset}`;
    // let { data: dataLogin, cookies: cookiesLogin, headers: headersLogin } = await fetchDataGet(urlLogin);
    // console.log({ dataLogin, cookiesLogin, headersLogin });
    // console.log(headersLogin);



    //Login dispatch
    //{"user_account":"151899","passwd":"c21591fe042411cfce53a0c52a539fcda3e9efab","mac_addr":"f37ff8dd-02c5-4f18-aaf4-f0f363f32dd6"}
    const urlToken = `https://ws-us.realptt.com/proxy/18.196.247.56:7782/check/logindispatcher`;
    let tokenPayload = { "user_account": account, "passwd": pwd, "mac_addr": "f37ff8dd-02c5-4f18-aaf4-f0f363f32dd6" }
    let { data, cookies } = await fetchDataPost(urlToken, tokenPayload);
    console.log({ data, cookies });

})()