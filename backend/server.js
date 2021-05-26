const http = require('http');
const port = process.env.PORT || 3001;
const { PassThrough } = require('stream');
const { generateData } = require('./data-generator');
const server = http.createServer((req, res) => {
    
    if(req.url === '/events') {
        return dispatchEventServerSentEvent(req, res);
    } else {
        res.writeHead(404);
        res.end("");
    }
});

server.listen(port);

server.on('error', (err) => {
    console.log(err);
    process.exit(1);
});
  
server.on('listening', () => {
    console.log(`[Http App] Listening on http://localhost:${port}`);
    setInterval(() => { 
        server.getConnections((error, count) => {
            console.log("[Http App] Open Connection Count", count);
        });
    }, 1000);
});


function dispatchEventServerSentEvent(req, res) {
    const channel = new PassThrough();
    const refreshRate = 50; // in milliseconds
    const noOfRecordPerEvent = 10;
    let eventCount = 0, eventId = 0, eventScheduler;
    res.writeHead(200, { 
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Encoding': 'identity'
    });
    
    /* Send Events Format
        @eventType - default type 'message'
        @id - string
        @data - string | object
        @retry - Number in milliseconds
    */
    
    eventScheduler = setInterval(() => {
        eventCount++;
        eventId = Date.now();
       
        // Message - Event
        if(eventCount === 1) {
            channel.write(`event:message\n`);
            channel.write(`id:${eventId-1}\n`);
            channel.write(`data: Welcome to learn about server sent events with reactjs table \n`);
            channel.write(`retry:10000\n\n`);
        }
        
        // Update - Event
        channel.write(`event:update\n`);
        channel.write(`id:${eventId}\n`);
        channel.write(`data:${JSON.stringify(generateData(noOfRecordPerEvent))}\n`);
        channel.write(`retry:10000\n\n`);

    }, refreshRate);

    req.on('close', () => {
        console.log("[Http App] Connection Closed by Browser");
        channel.end();
        clearInterval(eventScheduler);
    })

    setTimeout(() => {
    // Close - Event
        channel.write(`event:close\n`);
        channel.write(`id:${eventId+1}\n`);
        channel.write(`data: Event triggered from server to close the connection at client side.\n`);
        channel.write(`\n`); // end of stream
        channel.end();
        clearInterval(eventScheduler);
    }, 10000);

    return channel.pipe(res);

}
