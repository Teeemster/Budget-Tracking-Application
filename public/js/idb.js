//Variable to hold db connection
let db;
//Connects to IndexedDB database called 'budget_tracker' and set it to v1
const request = indexedDB.open('budget_tracker', 1);

//Event triggers if database version changes
request.onupgradeneeded = function (event) {
    //Saves a reference to the database
    const db = event.target.result;
    //Create a table called new_tracker and autoincrement
    db.createObjectStore('new_budget', { autoIncrement: true });
};

//On a successful request
request.onsuccess = function (event) {
    //When db is created from either from onsuccess or onupgradeneeded, save a reference to the db in the global variable
    db = event.target.result;

    //Checks if the application is online and if it is, run uploadBudget() to send all of the local db to the api
    if (navigator.onLine) {
        uploadBudget()
    }
};

//Logs error in event there is an error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//Function will be used if we update the budget tracker with no internet connection
function saveRecord(record) {
    //Opens a budget with read and write permissions
    const budget = db.budget(['new_budget'], 'readwrite');

    //Accesses the object store for the new budget
    const budgetObjectStore = budget.objectStore('new_budget');

    //Adds record to the object store
    budgetObjectStore.add(record);
}

function uploadBudget() {
    //Opens a budget on a pending database
    const budget = db.budget(['new_budget'], 'readwrite');

    //Accesses the pending database object store
    const budgetObjectStore = budget.objectStore('new_budget');

    //Sets all records from object store to variables
    const getAll = budgetObjectStore.getAll();

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

                    const budget = db.budget(['new_budget'], 'readwrite');
                    const budgetObjectStore = budget.objectStore('new_budget');
                    //Clears items in store
                    budgetObjectStore.clear();
                })
                .catch(err => {
                    //Catches for any errors
                    console.log(err);
                });
        }
    };
}

//Looks for the app online
window.addEventListener('online', uploadBudget);