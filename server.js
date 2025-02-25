const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Function to create a process
function createProcess(id) {
    const operations = ['+', '-', '*', '/', '%'];
    // Generate random max time between 7 and 18 seconds
    const tiempo_maximo = Math.floor(Math.random() * 12) + 7;
    const operacion = operations[Math.floor(Math.random() * operations.length)];
    let operando1 = Math.floor(Math.random() * 100) + 1;
    let operando2 = Math.floor(Math.random() * 100) + 1;
    
    // Ensure unique operands and prevent division/modulo by zero
    while (operando2 === 0 && (operacion === '/' || operacion === '%')) {
        operando2 = Math.floor(Math.random() * 100) + 1;
    }

    
    return {
        id: id,
        tiempo_maximo: tiempo_maximo,
        tiempo_restante: tiempo_maximo,
        operacion: operacion,
        operando1: operando1,
        operando2: operando2,
        estado: 'En espera',
        resultado: null
    };
}

// Function to create a batch of processes
function createBatch(startId, numProcesses) {
    const batch = [];
    // Ensure unique IDs and processes
    for (let i = 0; i < Math.min(3, numProcesses); i++) {
        const process = createProcess(startId + i);
        // Ensure process is unique
        while (batch.some(p => 
            p.operando1 === process.operando1 && 
            p.operando2 === process.operando2 &&
            p.operacion === process.operacion)) {
            process.operando1 = Math.floor(Math.random() * 100) + 1;
            process.operando2 = Math.floor(Math.random() * 100) + 1;
        }
        batch.push(process);
    }
    return batch;
}


// Store process data
let processData = {
    processes: [],
    pendingLots: 0,
    globalCounter: 0,
    currentProcess: null
};


// Function to initialize processes
function initializeProcesses(numProcesses) {
    let processes = [];
    let id = 1;
    while (numProcesses > 0) {
        const batch = createBatch(id, numProcesses);
        processes = processes.concat(batch);
        id += batch.length;
        numProcesses -= batch.length;
    }
    return processes;
}

// Function to simulate process execution
function simulateProcesses() {
    setInterval(() => {
        if (processData.currentProcess) {
            const process = processData.currentProcess;
            if (process.tiempo_restante > 0 && process.estado === 'En ejecucion') {
                process.tiempo_restante--;
                
                // If process completes
                if (process.tiempo_restante === 0) {
                    process.estado = 'Terminado';
                    // Calculate result
                    switch (process.operacion) {
                        case '+':
                            process.resultado = process.operando1 + process.operando2;
                            break;
                        case '-':
                            process.resultado = process.operando1 - process.operando2;
                            break;
                        case '*':
                            process.resultado = process.operando1 * process.operando2;
                            break;
                        case '/':
                            process.resultado = process.operando2 !== 0 ? 
                                (process.operando1 / process.operando2).toFixed(2) : 
                                'Error (division by zero)';
                            break;
                        case '%':
                            process.resultado = process.operando2 !== 0 ? 
                                process.operando1 % process.operando2 : 
                                'Error (modulo by zero)';
                            break;
                    }
                    // Move to next process if available
                    const nextProcess = processData.processes.find(p => p.estado === 'En espera');
                    if (nextProcess) {
                        processData.currentProcess = nextProcess;
                        nextProcess.estado = 'En ejecucion';
                    } else {
                        processData.currentProcess = null;
                    }
                }
            }
        } else {
            // Start first process if available
            const nextProcess = processData.processes.find(p => p.estado === 'En espera');
            if (nextProcess) {
                processData.currentProcess = nextProcess;
                nextProcess.estado = 'En ejecucion';
            }
        }
        
        // Send updates to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(processData));
            }
        });
    }, 1000);
}


// WebSocket connection
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify(processData));

    // Handle incoming messages
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.action === 'interrupt' && processData.currentProcess) {
            processData.currentProcess.estado = 'Interrumpido';
            processData.processes.push(processData.currentProcess);
            processData.currentProcess = null;
        } else if (data.action === 'error' && processData.currentProcess) {
            processData.currentProcess.estado = 'Error';
            processData.currentProcess = null;
        } else if (data.action === 'pause' && processData.currentProcess) {
            processData.currentProcess.estado = 'Pausado';
        } else if (data.action === 'continue' && processData.currentProcess) {
            processData.currentProcess.estado = 'En ejecucion';
        }
    });

    // Start simulating processes
    simulateProcesses();

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});


// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/start', (req, res) => {
    const numProcesses = parseInt(req.body.numProcesses);
    processData.processes = initializeProcesses(numProcesses);
    processData.pendingLots = Math.ceil(processData.processes.length / 3);
    processData.globalCounter = 0; // Reset global counter
    processData.currentProcess = null; // Reset current process
    res.redirect('/');
});


// Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
