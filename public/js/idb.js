//Variable to hold db connection
let db;
//Connects to IndexedDB database called 'transaction_tracker' and set it to v1
const request = indexedDB.open('transaction_tracker', 1);

//Event triggers if database version changes
request.onupgradeneeded = function (event) {
    //Saves a reference to the database
    const db = event.target.result;
    //Create a table called new_tracker and autoincrement
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//On a successful request
request.onsuccess = function (event) {
    //When db is created from either from onsuccess or onupgradeneeded, save a reference to the db in the global variable
    db = event.target.result;

    //Checks if the application is online and if it is, run uploadTransaction() to send all of the local db to the api
    if (navigator.onLine) {
        uploadTransaction() //caps
    }
};

//Logs error in event there is an error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//Function will be used if we update the transaction tracker with no internet connection
function saveRecord(record) {
    //Opens a transaction with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //Accesses the object store for the new transaction
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //Adds record to the object store
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    //Opens a transaction on a pending database
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //Accesses the pending database object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //Sets all records from object store to variables
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        //If data is in the indexDB's store, this will send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    //Clears items in store
                    transactionObjectStore.clear();
                })
                .catch(err => {
                    //Catches for any errors
                    console.log(err);
                });
        }
    };
}

//Looks for the app online
window.addEventListener('online', uploadTransaction);