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
 * Runs the logger and listens for metrics messages. Logs elapsed RX and TX byte
 * totals on each publish interval. If publish interval is 0, logs as metrics
 * messages are received.
 */
async function start() {
    let startRx = 0, startTx = 0
    let lastRx = 0, lastTx = 0
    try {
        await connectLocal()

        let pubInterval = process.env.PUBLISH_INTERVAL_SEC
        if (typeof pubInterval === 'undefined') {
            pubInterval = 0
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
                    const ifaceText = stats.iface ? stats.iface : "<unknown>"
                    console.log(`Received initial loggable message for interface ${ifaceText}; starting publish interval`)
                    console.log("elapsedRx,elapsedTx")

                    if (pubInterval != 0) {
                        setInterval(function() {
                            console.log(`${lastRx - startRx},${lastTx - startTx}`)
                            startRx = lastRx
                            startTx = lastTx
                        }, pubInterval)
                    }
                } else if (pubInterval == 0) {
                    console.log(`${lastRx - startRx},${lastTx - startTx}`)
                    startRx = lastRx
                    startTx = lastTx
                }
            })
        }
    } catch(e) {
        console.error(e)
    }
}

start()

