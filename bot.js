const dotenv = require('dotenv')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')

dotenv.config() 
const token = process.env.TELEGRAM_TOKEN
console.log(token)
const bot = new TelegramBot(token, {polling: true})

bot.on('message', (msg) => {
    const chatId = msg.chat.id
    const message = msg.text
    if(message == '/start'){
        bot.sendMessage(chatId, 'Hello! I am a bot. I am here to help you. Type /help to see all the commands')
    }

})

bot.onText(/\/prayer/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Please enter your country')
    bot.once('message', async (msg) => {
        try {
            const country = msg.text;
            bot.sendMessage(chatId, 'Please enter your city');
            bot.once('message', async (msg) => {
                try {
                    const city = msg.text;
                    const date = new Date();
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const prayerTimes = await getPrayerTimes(country, city, year, month, day);
                    bot.sendMessage(chatId, `Fajr: ${prayerTimes.Fajr}\nDhuhr: ${prayerTimes.Dhuhr}\nAsr: ${prayerTimes.Asr}\nMaghrib: ${prayerTimes.Maghrib}\nIsha: ${prayerTimes.Isha}`);
                } catch (error) {
                    console.error('Error getting prayer times:', error);
                    bot.sendMessage(chatId, 'Sorry, I could not get the prayer times. Please try again.');
                }
            });
        } catch (error) {
            console.error('Error handling country input:', error);
            bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
        }
    });
    
    })

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Here are the commands you can use:\n/prayer - Get today\'s prayer times')
})


async function getPrayerTimes(country, city, year, month, day){
    try {
        const response = await axios.get(`http://api.aladhan.com/v1/calendarByCity/${year}/${month}?method=5&city=${city}&country=${country}`);
        const data = response.data;
        return {
            Fajr: convertTo12HourFormat(data.data[day - 1].timings.Fajr),
            Dhuhr: convertTo12HourFormat(data.data[day - 1].timings.Dhuhr),
            Asr: convertTo12HourFormat(data.data[day - 1].timings.Asr),
            Maghrib: convertTo12HourFormat(data.data[day - 1].timings.Maghrib),
            Isha: convertTo12HourFormat(data.data[day - 1].timings.Isha)
        };
    } catch (error) {
        console.error('Error fetching prayer times from API:', error);
        throw new Error('Failed to fetch prayer times');
    }
}

function convertTo12HourFormat(time) {
    const [hours, minutes] = time.split(' ')[0].split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes} ${period}`;
}

module.exports = getPrayerTimes