document.addEventListener('DOMContentLoaded', () => {
    const restaurantSelect = document.getElementById('restaurantSelect');
    const message = document.getElementById('message');
    const editSection = document.getElementById('edit-section');
    const ratingsSection = document.getElementById('ratings-section');
    const editForm = document.getElementById('editForm');
    const restaurantName = document.getElementById('restaurantName');
    const restaurantDesc = document.getElementById('restaurantDesc');
    const restaurantIcon = document.getElementById('restaurantIcon');
    const currentIcon = document.getElementById('currentIcon');
    const ratingsList = document.getElementById('ratingsList');

    let restaurants = [];
    let selectedRestaurantId = null;

    async function loadRestaurants() {
        try {
            const res = await fetch('/api/restaurants');
            restaurants = await res.json();
            restaurantSelect.innerHTML = '<option value="">-- Select a restaurant --</option>';
            restaurants.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.restaurant_id;
                opt.textContent = r.restaurant_name;
                restaurantSelect.appendChild(opt);
            });
        } catch (err) {
            showMessage('Could not load restaurants.', 'error');
            console.error(err);
        }
    }

    restaurantSelect.addEventListener('change', async () => {
        selectedRestaurantId = restaurantSelect.value;
        if (!selectedRestaurantId) {
            editSection.classList.add('hidden');
            ratingsSection.classList.add('hidden');
            return;
        }

        try {
            const res = await fetch(`/api/restaurant/${selectedRestaurantId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch restaurant details.');
            }
            const { restaurant, ratings } = await res.json();

            // Populate edit form
            restaurantName.value = restaurant.restaurant_name;
            restaurantDesc.value = restaurant.restaurant_description;
            if (restaurant.restaurant_icon) {
                currentIcon.innerHTML = `<p>Current Icon:</p><img src="/icons/${restaurant.restaurant_icon}" alt="Current Icon" />`;
            } else {
                currentIcon.innerHTML = '<p>No icon set.</p>';
            }
            editSection.classList.remove('hidden');

            // Populate ratings
            renderRatings(ratings);
            ratingsSection.classList.remove('hidden');

        } catch (err) {
            showMessage('Error loading restaurant data.', 'error');
            console.error(err);
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('restaurant_name', restaurantName.value);
        formData.append('restaurant_description', restaurantDesc.value);
        if (restaurantIcon.files[0]) {
            formData.append('icon', restaurantIcon.files[0]);
        }

        try {
            const res = await fetch(`/api/restaurant/${selectedRestaurantId}`, {
                method: 'PATCH',
                body: formData,
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update restaurant.');
            }
            showMessage('Restaurant information updated successfully!', 'success');
            
            const selectedId = selectedRestaurantId;
            loadRestaurants().then(() => {
                restaurantSelect.value = selectedId;
                const changeEvent = new Event('change');
                restaurantSelect.dispatchEvent(changeEvent);
            });

        } catch (err) {
            showMessage(`Error updating restaurant: ${err.message}`, 'error');
            console.error(err);
        }
    });

    function renderRatings(ratings) {
        if (!ratings || ratings.length === 0) {
            ratingsList.innerHTML = '<p>No ratings for this restaurant.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'ratings-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${ratings.map(r => `
                    <tr data-rating-date="${r.rating_date}">
                        <td>${r.rating_date}</td>
                        <td>${r.rating}</td>
                        <td>${r.comment || ''}</td>
                        <td><button class="btn-delete" data-rating-date="${encodeURIComponent(r.rating_date)}">Delete</button></td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        ratingsList.innerHTML = '';
        ratingsList.appendChild(table);
    }
    
    ratingsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const ratingDate = e.target.dataset.ratingDate;
            if (confirm('Are you sure you want to delete this rating?')) {
                try {
                    const res = await fetch(`/api/rating/${selectedRestaurantId}/${ratingDate}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        let errorMsg = 'Failed to delete rating.';
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.error || errorMsg;
                        } catch (jsonError) {
                            errorMsg = 'Server returned a non-JSON error response.';
                        }
                        throw new Error(errorMsg);
                    }
                    showMessage('Rating deleted successfully', 'success');
                    
                    const row = ratingsList.querySelector(`tr[data-rating-date="${decodeURIComponent(ratingDate)}"]`);
                    if(row) row.remove();

                } catch (err) {
                    showMessage(`Error deleting rating: ${err.message}`, 'error');
                    console.error(err);
                }
            }
        }
    });

    function showMessage(text, type = 'info') {
        message.textContent = text;
        message.className = `message ${type}`;
        setTimeout(() => {
            message.textContent = '';
            message.className = 'message';
        }, 5000);
    }

    loadRestaurants();
});
