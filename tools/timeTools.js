

function convertToTimezone(dateString, timeZone = 'America/Mexico_City') {
    const date = new Date(dateString); // Convierte la cadena a un objeto Date

    // Formatea la fecha en la zona horaria deseada
    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };

    // Formatear la fecha a la zona horaria proporcionada
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);

    return formattedDate;
}

function convertToTimezoneDate(dateString, timeZone) {
    const date = new Date(dateString); // Convierte la cadena a un objeto Date

    // Formatea solo la fecha en la zona horaria deseada
    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    // Formatear la fecha a la zona horaria proporcionada
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);

    // Convertir al formato deseado YYYY-MM-DD
    const [month, day, year] = formattedDate.split('/');
    return `${year}-${month}-${day}`;
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Mes (0 indexado)
    const day = String(now.getDate()).padStart(2, '0'); // Día del mes

    return `${year}-${month}-${day}`;
}



// // Ejemplo de uso
// const utcDate = '2025-01-12T10:10:42.000Z';
// const timeZone = 'America/Mexico_City'; // Zona horaria de Guadalajara
// const result = convertToTimezoneDate(utcDate, timeZone);

// console.log(result); // Salida en CST (UTC-6)

module.exports = {
    convertToTimezone,
    convertToTimezoneDate,
    getCurrentDate
}