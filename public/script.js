const processData = {
    processes: [],
    pendingLots: 0,
    globalCounter: 0
};

document.addEventListener('DOMContentLoaded', () => {
    const processForm = document.getElementById('processForm');
    const globalCounter = document.getElementById('globalCounter');
    const pendingLots = document.getElementById('pendingLots');
    const currentProcessId = document.getElementById('currentProcessId');
    const currentProcessOperation = document.getElementById('currentProcessOperation');
    const currentProcessTime = document.getElementById('currentProcessTime');
    const currentProcessStatus = document.getElementById('currentProcessStatus');
    const processQueue = document.getElementById('processQueue');
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateUI(data);
    };

function updateUI(data) {
    // Display results from each operation
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = ''; // Clear previous results

        // Update global counter and pending lots
        globalCounter.textContent = `Global Counter: ${data.globalCounter}`;
        pendingLots.textContent = `Pending Lots: ${data.pendingLots}`;

        // Update current process
        if (data.currentProcess) {
            currentProcessId.textContent = data.currentProcess.id;
            currentProcessOperation.textContent = 
                `${data.currentProcess.operando1} ${data.currentProcess.operacion} ${data.currentProcess.operando2}`;
            currentProcessTime.textContent = data.currentProcess.tiempo_restante;
            currentProcessStatus.textContent = data.currentProcess.estado;
        } else {
            currentProcessId.textContent = 'None';
            currentProcessOperation.textContent = 'None';
            currentProcessTime.textContent = '0';
            currentProcessStatus.textContent = 'None';
        }

        // Display results for each operation
        if (data.results) {
            data.results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.textContent = `Result: ${result}`;
                resultsContainer.appendChild(resultItem);
            });
        }

        // Update process queue with results
        processQueue.innerHTML = '';
        data.processes.forEach(process => {
            const li = document.createElement('li');
            li.textContent = `ID: ${process.id} | Operation: ${process.operando1} ${process.operacion} ${process.operando2} | Time: ${process.tiempo_restante} | Status: ${process.estado} | Result: ${process.result}`; // Display result next to operation
            processQueue.appendChild(li);
        });


        processQueue.innerHTML = '';
        data.processes.forEach(process => {
            const li = document.createElement('li');
            li.textContent = `ID: ${process.id} | Operation: ${process.operando1} ${process.operacion} ${process.operando2} | Time: ${process.tiempo_restante} | Status: ${process.estado} | Result: ${process.resultado}`; // Display result next to operation

            processQueue.appendChild(li);
        });
    }


    processForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const numProcesses = document.getElementById('numProcesses').value;
        fetch('/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `numProcesses=${numProcesses}`
        });
    });


    document.addEventListener('keydown', (event) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        
        switch (event.key) {
            case 'i':
                ws.send(JSON.stringify({ action: 'interrupt' }));
                break;
            case 'e':
                ws.send(JSON.stringify({ action: 'error' }));
                break;
            case 'p':
                ws.send(JSON.stringify({ action: 'pause' }));
                break;
            case 'c':
                ws.send(JSON.stringify({ action: 'continue' }));
                break;
        }
    });

});
