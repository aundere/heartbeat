# heartbeat

A lightweight uptime monitoring tool written in JavaScript.

## How to use

**WARNING!**: *node.js* or *bun.js* is required to run this script.

Just copy the `heartbeat.js` file to your server and run it with Node.js:

```bash
node heartbeat.js
```

or

```bash
./heartbeat.js
```

### Configuration

You can use environment variables to configure the script:

- `HTTP_PORT` - The port on which the HTTP server will listen (default: `3000`)
- `NO_HEARTBEAT_TIME` - The time in seconds after which the server will be     considered down if no heartbeat is received (default: `300`)
- `SECRET_KEY` - A secret key for the heartbeat endpoint (default: empty). If set, the script will require this key to be sent in the `X-Secret-Key` header.

The script supports only Discord Webhooks for notifications. You can add your own alerting services by modifying the `alertServices` array in the script. Example:

```javascript
const alertServices = {

    // This function will be called when no heartbeat is received
    // First parameter is the status object, second is an array of parameters
    // (splitted by semicolon environment variable value)
    // To use you need to set the environment variable ALERT_CONSOLE='your message;ERROR'
    // Every time the server is down, this function will be called
    // and the message "[*timestamp*] [ERROR] your message" will be logged to the console
    console: (status, [ text, title ]) => {
        console.log(`${status.lastReceivedHeartbeat}: [${title}] ${text}`)
    }
}
```

To use Discord Webhooks, set the environment variable `ALERT_DISCORD` with this format:
`WEBHOOK_URL;Your Message`.

Example configuration:

```bash
HTTP_PORT=8080 ALERT_DISCORD='https://discord.com/...;@everyone, Alert!' node heartbeat.js
```

### Receiving Heartbeats

This script listens for HTTP POST requests on the `/heartbeat` endpoint. You can send a heartbeat by making a POST request to this endpoint with an empty body.

Example using `curl`:

```bash
curl -X POST http://localhost:3000/heartbeat
```

You can also monitor the server status by sending a GET request to the `/status` endpoint:

```bash
curl -s http://localhost:3000/status | jq
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
