async function getFaunaSecret() {
    const response = await fetch('/.netlify/functions/getFaunaSecret');
    const data = await response.json();
    console.log("FaunaDB Secret from client:", data.secret); // Log the secret for debugging
    return data.secret;
}

getFaunaSecret().then(secret => {
    const client = new faunadb.Client({ secret });
    const q = faunadb.query;

    // Function to test FaunaDB connection and index
    function testFaunaConnection() {
        client.query(
            q.Paginate(q.Collections())
        )
        .then(response => {
            console.log('FaunaDB connection successful:', response);
            alert('FaunaDB connection successful');
        })
        .catch(err => {
            console.error('FaunaDB connection error:', err);
            alert('FaunaDB connection error. Check console for details.');
        });

        // Test if the index exists
        client.query(
            q.Paginate(q.Indexes())
        )
        .then(response => {
            console.log('FaunaDB indexes:', response);
            if (!response.data.some(index => index.id === 'meal_by_date2')) {
                console.error('Index "meal_by_date2" does not exist.');
                alert('Index "meal_by_date2" does not exist. Please create it in your FaunaDB dashboard.');
            }
        })
        .catch(err => {
            console.error('FaunaDB index error:', err);
            alert('FaunaDB index error. Check console for details.');
        });
    }

    document.getElementById('meal-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const date = document.getElementById('date').value;
        const breakfast = document.getElementById('breakfast').value;
        const lunch = document.getElementById('lunch').value;
        const snacks = document.getElementById('snacks').value;
        const dinner = document.getElementById('dinner').value;

        const mealPlan = { date, breakfast, lunch, snacks, dinner };

        client.query(
            q.Create(
                q.Collection('plans2'),
                { data: mealPlan }
            )
        ).then(() => {
            console.log('Meal plan saved:', mealPlan);
            displayMealPlans();
            document.getElementById('meal-form').reset();
        }).catch(err => console.error('Error: ', err));
    });

    function deleteMealPlan(ref) {
        client.query(
            q.Delete(q.Ref(q.Collection('plans2'), ref))
        ).then(() => {
            console.log('Meal plan deleted:', ref);
            displayMealPlans();
        }).catch(err => console.error('Error: ', err));
    }

    function displayMealPlans() {
        client.query(
            q.Paginate(
                q.Documents(q.Collection('plans2'))
            )
        ).then(response => {
            console.log('Meal plans fetched:', response.data);
            const mealPlansTable = document.getElementById('meal-plans');
            mealPlansTable.innerHTML = '';

            const mealPlanPromises = response.data.map(ref => {
                return client.query(q.Get(ref)).then(plan => {
                    console.log('Meal plan data:', plan.data);
                    return {
                        ref: ref,
                        data: plan.data
                    };
                });
            });

            Promise.all(mealPlanPromises).then(mealPlans => {
                mealPlans.sort((a, b) => new Date(a.data.date) - new Date(b.data.date));
                mealPlans.forEach(plan => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${plan.data.date}</td>
                        <td>${plan.data.breakfast}</td>
                        <td>${plan.data.lunch}</td>
                        <td>${plan.data.snacks}</td>
                        <td>${plan.data.dinner}</td>
                        <td><button class="delete-btn" onclick='deleteMealPlan("${plan.ref.id}")'>Delete</button></td>
                    `;
                    mealPlansTable.appendChild(row);
                });
            });
        }).catch(err => console.error('Error: ', err));
    }

    document.addEventListener('DOMContentLoaded', () => {
        testFaunaConnection();
        displayMealPlans();
    });
});
