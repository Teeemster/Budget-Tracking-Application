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

request.onerror = function (event) {
    //Logs error in event there is an error
    console.log(event.target.errorCode);
};

//Function will be used if we update the budget tracker with no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const budget = db.transaction(['new_budget'], 'readwrite');

    // access the object store for `new_pizza`
    const budgetObjectStore = budget.objectStore('new_budget');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
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

                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    const pizzaObjectStore = transaction.objectStore('new_budget');
                    // clear all items in your store
                    pizzaObjectStore.clear();
                })
                .catch(err => {
                    // set reference to redirect back here
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);