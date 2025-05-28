#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from 'http'

// Environment: HTTP_PORT
const HTTP_PORT = process.env.HTTP_PORT || 3000

// Environment: NO_HEARTBEAT_TIME
const NO_HEARTBEAT_TIME_SECONDS = process.env.NO_HEARTBEAT_TIME || 300 // 5 minutes

// Environment: SECRET_KEY
const SECRET_KEY = process.env.SECRET_KEY

/**
 * @typedef {Object.<string, (status: HeartbeatStatus, params: string[]) => void>} HeartbeatServices
 */

/** @type {HeartbeatServices} */
const alertServices = {

    // Discord Webhook service
    // Usage: ALERT_DISCORD="https://discord.com/...;Your message here"
    discord: (_, [ url, message ]) => {
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message || `No heartbeat received in the last ${NO_HEARTBEAT_TIME_SECONDS} seconds`
            })
        }).catch(err => {
            console.error(`Failed to send Discord alert: ${err.message}`)
        })
    }
}

/** @returns {(status: HeartbeatStatus) => void} */
const createServiceFunction = (env, func) => {
    return (status) => {
        const params = env.split(';')
        alertServices[func](status, params)
    }
}

/** @type {string[]} */
const serviceEnvironmentVariables = Object.keys(process.env).filter(key => {
    return key.startsWith('ALERT_') && alertServices[key.replace('ALERT_', '').toLowerCase()]
})

/** @type {Array<Function>} */
const serviceFunctions = serviceEnvironmentVariables.map(key => {
    const funcName = key.replace('ALERT_', '').toLowerCase()
    return createServiceFunction(process.env[key], funcName)
})

/**
 * @typedef {Object} HeartbeatStatus
 * @property {number | null} lastReceivedHeartbeat
 */

/** @type {HeartbeatStatus} */
const status = {
    lastReceivedHeartbeat: null,
    isAlertRaised: false
}

/** @param {ServerResponse<IncomingMessage>} res */
const handleHeartbeat = (res) => {
    if (status.lastReceivedHeartbeat == null)
        console.log('Received first heartbeat. Starting heartbeat checks')

    status.lastReceivedHeartbeat = Date.now()
    status.isAlertRaised = false

    res.writeHead(200).end()
}

/** @param {ServerResponse<IncomingMessage>} res */
const handleStatus = (res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(status))
}

/** @param {ServerResponse<IncomingMessage>} res */
const handleNotFound = (res) => {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
}

/** @param {ServerResponse<IncomingMessage>} res */
const handleUnauthorized = (res) => {
    res.writeHead(401, { 'Content-Type': 'text/plain' })
    res.end('Unauthorized')
}

// Check for heartbeat every 10 seconds
setInterval(() => {
    const allowedTime = Date.now() - (NO_HEARTBEAT_TIME_SECONDS * 1000)

    if (status.lastReceivedHeartbeat && status.lastReceivedHeartbeat < allowedTime && !status.isAlertRaised) {
        status.isAlertRaised = true

        console.warn(`*WARN* No heartbeat received in the last ${NO_HEARTBEAT_TIME_SECONDS} seconds`)
        serviceFunctions.forEach(func => func(status))
    }
}, 10_000 /* 10 seconds */)

// Create the HTTP server
createServer((req, res) => {
    // Log the request
    console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}:${req.socket.remotePort}`)

    // Check for secret key
    if (SECRET_KEY && req.headers['x-secret-key'] != SECRET_KEY)
        handleUnauthorized(res)

    // GET /status
    else if (req.method == 'GET' && req.url === '/status')
        handleStatus(res)
    
    // POST /heartbeat
    else if (req.method == 'POST' && req.url === '/heartbeat')
        handleHeartbeat(res)

    // Not Found
    else handleNotFound(res)
}).listen(HTTP_PORT, () => {
    console.log(`Heartbeat server running on port ${HTTP_PORT}`)
    console.log('Note: Use POST /heartbeat to start heartbeat checks')
})
