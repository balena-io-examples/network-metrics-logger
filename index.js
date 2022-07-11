import mqtt from 'async-mqtt'
// just for debugging with util.inspect, etc.
//import util from 'util'

// async wrapper for MQTT client
let mqttClient = null

/**
 * Connects and subscribes to metrics topic. Retries twice if can't connect.
 *
 * If success, 'mqttClient' is not null.
 */
async function connectLocal() {
    if (!process.env.METRICS_TOPIC) {
        process.env.METRICS_TOPIC = 'sensors'
    }

    let count = 0
    const maxTries = 3
    const delay = 5
    do { 
        try {
            count++
            if (!mqttClient) {
                mqttClient = await mqtt.connectAsync(`mqtt://${process.env.MQTT_ADDRESS}`)
                console.log(`Connected to mqtt://${process.env.MQTT_ADDRESS}`)
            }
            await mqttClient.subscribe(process.env.METRICS_TOPIC, { qos: 1 })
            console.log("Subscribed to topic:", process.env.METRICS_TOPIC)
            break
        } catch(e) {
            console.warn("Cannot connect to local MQTT:", e)
            if (count < maxTries) {
                console.log(`Retry in ${delay} seconds`)
                await new Promise(r => setTimeout(r, delay * 1000))
            } else {
                console.warn(`Retries exhausted`)
                mqttClient = null  // indicates connection failed
            }
        }
    } while(count < maxTries)
}

/**
 * Runs the logger. On each publish interval, logs elapsed RX and TX byte totals.
 */
async function start() {
    let startRx = 0, startTx = 0
    let lastRx = 0, lastTx = 0
    try {
        await connectLocal()

        let pubInterval = process.env.PUBLISH_INTERVAL_SEC
        if (!pubInterval) {
            pubInterval = 300
        }
        console.log(`Publish interval: ${pubInterval} sec`)
        pubInterval *= 1000
        
        if (mqttClient) {
            mqttClient.on('message', function (topic, message) {
                //console.log(`incoming message: ${message}`)
                const jsonMsg = JSON.parse(message)
                const stats = jsonMsg["networkStats/0"]
                lastRx = stats.rx_bytes
                lastTx = stats.tx_bytes
                if (startRx == 0) {
                    startRx = lastRx
                    startTx = lastTx
                    const iface = stats.iface ? stats.iface : "(not provided)"
                    console.log(`Received initial loggable message for interface ${iface}; starting publish interval`)

                    setInterval(function() {
                        console.log(`elapsedRx: ${lastRx - startRx}, elapsedTx: ${lastTx - startTx}`)
                        startRx = lastRx
                        startTx = lastTx
                    }, pubInterval)
                }
            })
        }
    } catch(e) {
        console.error(e)
    }
}

start()

