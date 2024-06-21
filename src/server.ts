import { KafkaClient, Producer, ProduceRequest } from 'kafka-node';
import axios from 'axios';
import { ConsumerGroup, ConsumerGroupOptions } from 'kafka-node';
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const kafkaHost = 'localhost:9092';
const kafkaTopic = 'weather-data';
const numPartitions = 10;

let producers: { [key: string]: Producer } = {}; // Object pour stocker les producteurs par ville

const fetchWeatherData = async (city: string): Promise<any> => {
    const cityCapitalized = city[0].toUpperCase() + city.slice(1);
    const apiKey = '4c6c9d26537346acb8080226242106';
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${cityCapitalized}`;

    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error(`Error fetching weather data for ${city}:`, error.message);
        return null;
    }
}

const createProducer = async (city: string) => {
    const data = await fetchWeatherData(city);
    if (!data) {
        return;
    }

    const client = new KafkaClient({ kafkaHost });
    const producer = new Producer(client);
    producers[data.location.name] = producer;

    producer.on('error', function (err) {
        console.error(`Error producing to Kafka for ${city}:`, err);
    });
}

const closeProducer = (city: string) => {
    if (producers[city]) {
        producers[city].close(() => {
            console.log(`Producer for ${city} closed`);
        });
        delete producers[city];
    }
}

const produceWeatherData = async (city: string) => {

    const weatherData = await fetchWeatherData(city);

    if (weatherData) {

        const cityName = weatherData.location.name;
        
        if (city !== cityName) {
            producers[cityName] = producers[city];
            delete producers[city];
        }

        if (producers[cityName]) {
            const partition = Math.floor(Math.random() * numPartitions);
            const payloads: ProduceRequest[] = [
                {
                    topic: kafkaTopic,
                    messages: JSON.stringify(weatherData),
                    partition
                },
            ];

            producers[cityName].send(payloads, (err, data) => {
                if (err) {
                    console.error(`Error producing to Kafka for ${city}:`, err);
                } else {
                    console.log(`Message sent for ${city}:`, data);
                }
            });
        }
    }
}

setInterval(() => {
    console.log('Cities:', Object.keys(producers));
    Object.keys(producers).forEach(city => produceWeatherData(city));
}, 5000);

const consumerGroupOptions: ConsumerGroupOptions = {
    kafkaHost,
    groupId: 'weather-consumer-group',
    autoCommit: true,
    fromOffset: 'latest',
    encoding: 'utf8',
};

const consumerGroup = new ConsumerGroup(consumerGroupOptions, [kafkaTopic]);

const wss = new WebSocketServer({ port: 5500 });

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        try {
            const data = JSON.parse(message.toString());

            if (data.city && !producers[data.city]) {
                createProducer(data.city);
                console.log(`City added: ${data.city}`);
            } else if (data.city && data.remove && producers[data.city]) {
                closeProducer(data.city);
                console.log(`City removed: ${data.city}`);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
});

consumerGroup.on('message', function (message) {
    try {
        const weatherData = JSON.parse(message.value.toString());

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(weatherData));
            }
        });
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

consumerGroup.on('error', function (error) {
    console.error('Error in Kafka consumer group:', error);
});

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

server.on('upgrade', function (request, socket, head) {
    wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
    });
});

server.listen(80, function () {
    console.log('Server is running on http://localhost:80');
});

process.on('SIGINT', function () {
    consumerGroup.close(true, function () {
        Object.keys(producers).forEach(city => closeProducer(city)); // Fermer tous les producteurs avant de terminer
        process.exit();
    });
});
