// Ensure the FaunaDB library is available
const q = window.faunadb.query;

// Initialize FaunaDB client
const client = new window.faunadb.Client({ secret: 'YOUR_FAUNADB_SECRET' });
console.log('FaunaDB client initialized:', client);

// Function to get the number of days in the current month
const getDaysInCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return new Date(year, month, 0).getDate();
};

// Function to get the current month name
const getCurrentMonthName = () => {
    const now = new Date();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[now.getMonth()];
};

// Function to populate the date select dropdown
const populateDateSelect = () => {
    const daysInMonth = getDaysInCurrentMonth();
    const dateSelect = document.getElementById('date');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day).toLocaleDateString();
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    }
};

// Function to generate the meal table for the current month
const generateMealTable = () => {
    const daysInMonth = getDaysInCurrentMonth();
    const mealTableBody = document.querySelector('#mealTable tbody');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day).toLocaleDateString();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td id="breakfast-${date}"></td>
            <td id="lunch-${date}"></td>
            <td id="snack-${date}"></td>
            <td id="dinner-${date}"></td>
        `;
        mealTableBody.appendChild(row);
    }
};

// Function to fetch meals from FaunaDB
const fetchMeals = async () => {
    try {
        console.log('Fetching meals...');
        const response = await client.query(
            q.Map(
                q.Paginate(q.Match(q.Index('meal_by_date'))),
                q.Lambda('X', q.Get(q.Var('X')))
            )
        );

        console.log('Meals fetched:', response);

        response.data.forEach(doc => {
            const { date, breakfast, lunch, snack, dinner } = doc.data;
            document.getElementById(`breakfast-${date}`).textContent = breakfast;
            document.getElementById(`lunch-${date}`).textContent = lunch;
            document.getElementById(`snack-${date}`).textContent = snack;
            document.getElementById(`dinner-${date}`).textContent = dinner;
        });
    } catch (error) {
        console.error('Error fetching meals:', error);
    }
};

// Function to update the meal in the table and FaunaDB
const updateMeal = async () => {
    const date = document.getElementById('date').value;
    const breakfast = document.getElementById('breakfast').value;
    const lunch = document.getElementById('lunch').value;
    const snack = document.getElementById('snack').value;
    const dinner = document.getElementById('dinner').value;

    console.log('Updating meal for date:', date);
    console.log('Meal details:', { breakfast, lunch, snack, dinner });

    document.getElementById(`breakfast-${date}`).textContent = breakfast;
    document.getElementById(`lunch-${date}`).textContent = lunch;
    document.getElementById(`snack-${date}`).textContent = snack;
    document.getElementById(`dinner-${date}`).textContent = dinner;

    try {
        console.log('Checking for existing meal...');
        const existingMeal = await client.query(
            q.Get(q.Match(q.Index('meal_by_date'), date))
        );

        console.log('Existing meal found:', existingMeal);

        // Update the existing meal
        await client.query(
            q.Update(existingMeal.ref, {
                data: { breakfast, lunch, snack, dinner }
            })
        );

        console.log('Meal updated:', { date, breakfast, lunch, snack, dinner });
    } catch (error) {
        if (error.name === 'NotFound') {
            console.log('No existing meal found, creating new meal...');
            // If the meal doesn't exist, create a new one
            await client.query(
                q.Create(q.Collection('plans'), {
                    data: { date, breakfast, lunch, snack, dinner }
                })
            );

            console.log('Meal created:', { date, breakfast, lunch, snack, dinner });
        } else {
            console.error('Error updating meal:', error);
        }
    }

    // Clear the form fields
    document.getElementById('breakfast').value = '';
    document.getElementById('lunch').value = '';
    document.getElementById('snack').value = '';
    document.getElementById('dinner').value = '';
};

// Initialize the page after DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    populateDateSelect();
    generateMealTable();
    fetchMeals();
});
