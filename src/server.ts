import { KafkaClient, Consumer, ConsumerOptions } from 'kafka-node';
import { WebSocketServer , WebSocket}  from 'ws';
import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Kafka
const kafkaHost = 'localhost:9092'; // Remplacez par l'adresse de votre serveur Kafka
const client = new KafkaClient({ kafkaHost });

// Configuration du consumer Kafka
const consumerOptions: ConsumerOptions = {
    groupId: 'weather-consumer-group',
    autoCommit: true, // Ou false selon vos besoins
    fetchMaxBytes: 1024 * 1024, // Exemple d'autres options possibles
};

const consumer = new Consumer(client, [], consumerOptions);
const kafkaTopic = 'weather-data'; // Le topic à écouter

// Création du serveur WebSocket pour communiquer avec l'interface web
const wss = new WebSocketServer({ noServer: true }); // WebSocketServer sans serveur HTTP initial

// Gestion des connexions WebSocket
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');
    // Vous pouvez potentiellement gérer des événements supplémentaires ici
});

// Écoute des messages Kafka sur le topic spécifié
consumer.addTopics([{ topic: kafkaTopic, partition: 0 }], (err, added) => {
    if (err) {
        console.error('Error from addTopics:', err);
    } else {
        console.log(`Added topics: ${added}`);
    }
});

// Écoute des messages Kafka
consumer.on('message', function(message) {
    try {
        const weatherData = JSON.parse(message.value.toString());
        console.log('Received weather data:', weatherData);
        // Envoyer les données aux clients WebSocket (interface web)
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(weatherData));
            }
        });
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

consumer.on('error', function(error) {
    console.error('Error in Kafka consumer:', error);
});

// Création de l'application Express
const app = express();
const server = http.createServer(app);

// Routage pour servir index.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Montage du serveur WebSocket sur le serveur HTTP
server.on('upgrade', function(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function(ws) {
        wss.emit('connection', ws, request);
    });
});

// Démarrage du serveur HTTP
server.listen(80, function() {
    console.log('Server is running on http://localhost:80');
});

// Assurez-vous de gérer correctement les erreurs et la terminaison du processus
process.on('SIGINT', function() {
    consumer.close(true, function() {
        process.exit();
    });
});
