import { KafkaClient, Producer, ProduceRequest } from 'kafka-node';
import axios from 'axios';

// Configuration Kafka
const kafkaHost = 'localhost:9092'; // Remplacez par l'adresse de votre serveur Kafka

const client = new KafkaClient({ kafkaHost });
const producer = new Producer(client);

// Topic sur lequel envoyer les messages
const kafkaTopic = 'weather-data';

// Fonction pour récupérer les données météo depuis l'API
async function fetchWeatherData(): Promise<any> {
    const apiKey = '4c6c9d26537346acb8080226242106';
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Paris`;

    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        return null;
    }
}

// Fonction pour envoyer les données au topic Kafka
async function produceWeatherData() {
    const weatherData = await fetchWeatherData();

    if (weatherData) {
        const payloads: ProduceRequest[] = [
            {
                topic: kafkaTopic,
                messages: JSON.stringify(weatherData),
            },
        ];

        producer.send(payloads, (err, data) => {
            if (err) {
                console.error('Error producing to Kafka:', err);
            } else {
                console.log('Message sent:', data);
            }
        });
    }
}

// Envoi des données toutes les 5 secondes (par exemple)
setInterval(produceWeatherData, 5000);
