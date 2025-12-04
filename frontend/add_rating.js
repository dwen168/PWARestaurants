const restaurantInput = document.getElementById('restaurantInput');
const restaurantsList = document.getElementById('restaurants-list');
const ratingInput = document.getElementById('ratingInput');
const starRatingContainer = document.getElementById('starRating');
const commentInput = document.getElementById('commentInput');
const descBlock = document.getElementById('descBlock');
const restaurantDesc = document.getElementById('restaurantDesc');
const restaurantIcon = document.getElementById('restaurantIcon');

const form = document.getElementById('addForm');
const result = document.getElementById('result');
const avgRating = document.getElementById('avgRating');

// Convert numeric rating to star display (0-5 stars, 0.5 increment)
function renderStars(rating) {
  const numRating = Number(rating);
  const fullStars = Math.floor(numRating);
  const hasHalfStar = (numRating % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHtml = '';

  //filled stars
  if (fullStars > 0) {
    starsHtml += '<span class="stars-filled">'+'★'.repeat(fullStars)+'</span>';
  }

  //half star
  if (hasHalfStar) {
    starsHtml += '<span class="stars-filled"><span class="half-star-wrapper">★</span></span>'
  }

  //empty stars
  if (emptyStars > 0) {
    starsHtml += '<span class="stars-empty">'+'☆'.repeat(emptyStars)+'</span>';
  }

  return starsHtml;
}

// Initialize star rating display
function initStarRating() {
  starRatingContainer.innerHTML = '';
  const currentRating = Number(ratingInput.value);
  for (let i = 1; i <= 5; i++) {
    const starContainer = document.createElement('div');
    starContainer.className = 'star-container';
    starContainer.setAttribute('role', 'button');
    starContainer.setAttribute('tabindex', '0');
    
    // Background star (always visible)
    const bgStar = document.createElement('span');
    bgStar.className = 'star-bg';
    bgStar.textContent = '☆'; // Empty star
    
    // Filled star overlay
    const filledStar = document.createElement('span');
    filledStar.className = 'star-filled';
    filledStar.textContent = '★'; // Full star
    
    // Determine fill percentage
    let fillPercentage = 0;
    if (currentRating >= i) {
      fillPercentage = 100;
    } else if (currentRating > i - 1) {
      fillPercentage = (currentRating - (i - 1)) * 100;
    }
    filledStar.style.width = fillPercentage + '%';
    
    // Click handler on container - detect which half was clicked
    starContainer.addEventListener('click', (e) => {
      const rect = starContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;
      setRating(isLeftHalf ? i - 0.5 : i);
    });
    
    // Keyboard handler
    starContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setRating(i);
      }
    });
    
    starContainer.appendChild(bgStar);
    starContainer.appendChild(filledStar);
    starRatingContainer.appendChild(starContainer);
  }
}

function setRating(value) {
  ratingInput.value = value;
  initStarRating();
}

// Initialize on page load
initStarRating();
ratingInput.addEventListener('change', initStarRating);


let restaurantNames = [];


let restaurantMap = {};
// Fetch restaurant names for autocomplete
async function loadRestaurantNames() {
  try {
    const res = await fetch('/api/restaurants');
    const list = await res.json();
    restaurantNames = list.map(r => r.restaurant_name);
    restaurantMap = {};
    list.forEach(r => { restaurantMap[r.restaurant_name.toLowerCase()] = r.restaurant_id; });
    restaurantsList.innerHTML = '';
    restaurantNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      restaurantsList.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}
// Fetch and show average rating for selected restaurant
async function showAverageRating(name) {
  avgRating.textContent = '';
  if (!name) return;
  const id = restaurantMap[name.toLowerCase()];
  if (!id) return;
  try {
    const res = await fetch(`/api/restaurant/${id}`);
    if (!res.ok) return;
    const payload = await res.json();
    const ratings = payload.ratings || [];
    if (ratings.length === 0) {
      avgRating.textContent = 'No ratings yet.';
      return;
    }
    const avg = ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length;
    const starRating = renderStars(avg);
    avgRating.innerHTML = `<strong>${starRating}</strong> <span class="rating-detail">(${avg.toFixed(2)}/5 (${ratings.length} ratings)</span>`;
  } catch (err) {
    avgRating.textContent = '';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = '';
  const restaurant_name = restaurantInput.value.trim();
  const rating = Number(ratingInput.value);
  const comment = commentInput.value.trim();
  if (!restaurant_name) {
    result.textContent = 'Please enter a restaurant name';
    return;
  }
  if (Number.isNaN(rating) || rating < 0 || rating > 5){
    result.textContent = 'Rating must be between 0 and 5';
    return;
  }

  // Check if restaurant exists (case-insensitive match)
  const exists = restaurantNames.some(name => name.toLowerCase() === restaurant_name.toLowerCase());

  // If creating new restaurant, allow empty description but use default if not provided
  // Reveal description input so user can optionally type one
  if (!exists && descBlock) descBlock.classList.remove('hidden');

  try{
    // use FormData to handle file upload and text fields
    const formData = new FormData();
    formData.append('restaurant_name', restaurant_name);
    formData.append('rating', rating);
    formData.append('comment', comment);
    if (!exists) {
      const descValue = restaurantDesc && restaurantDesc.value.trim()
        ? restaurantDesc.value.trim()
        : 'There is no description for this restaurant.';
      formData.append('restaurant_description', descValue);
    }
    // add icon file if provided
    if (restaurantIcon && restaurantIcon.files.length > 0) {
      formData.append('icon', restaurantIcon.files[0]);
    }

    const res = await fetch(`/api/restaurant/rating`, {
      method: 'POST',
      body: formData // Don't set Content-Type, browser will set it including boundary
    });
    const payload = await res.json();
    if (!res.ok) {
      result.textContent = payload.error || 'Failed to submit rating';
      return;
    }
    result.textContent = exists
      ? 'Rating added to existing restaurant — ' + (payload.rating_date || '')
      : 'New restaurant created and rating added — ' + (payload.rating_date || '');
    // Optionally clear form
    ratingInput.value = '5';
    commentInput.value = '';
    restaurantInput.value = '';
    if (restaurantDesc) restaurantDesc.value = '';
    if (restaurantIcon) restaurantIcon.value = '';
    // Refresh restaurant names for next time
    loadRestaurantNames();
  }catch(err){
    console.error(err);
    result.textContent = 'Network error while submitting';
  }
});


// Initial load
loadRestaurantNames();

// Show average rating when restaurant name changes and matches existing
restaurantInput.addEventListener('input', () => {
  const name = restaurantInput.value.trim();
  // Show or hide description input depending on existence
  const exists = restaurantNames.some(n => n.toLowerCase() === name.toLowerCase());
  if (descBlock) {
    if (name && !exists) descBlock.classList.remove('hidden');
    else descBlock.classList.add('hidden');
  }
  showAverageRating(name);
});
