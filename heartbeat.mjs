#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from 'http'

const PORT = process.env.PORT || 3000

/**
 * @typedef {Object} HeartbeatStatus
 * @property {Date | null} lastReceivedHeartbeat
 */

/** @type {HeartbeatStatus} */
const status = {
    lastReceivedHeartbeat: null
}

/** @param {ServerResponse<IncomingMessage>} res */
const handleHeartbeat = (res) => {
    status.lastReceivedHeartbeat = Date.now()
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

createServer((req, res) => {
    // Log the request
    console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}:${req.socket.remotePort}`)

    // GET /status
    if (req.method == 'GET' && req.url === '/status')
        handleStatus(res)
    
    // POST /heartbeat
    else if (req.method == 'POST' && req.url === '/heartbeat')
        handleHeartbeat(res)

    // Not Found
    else handleNotFound(res)
}).listen(PORT, () => {
    console.log(`Heartbeat server running on port ${PORT}`)
})
