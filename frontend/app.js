const restaurantsList = document.getElementById('restaurants-list');
const input = document.getElementById('restaurantInput');
const form = document.getElementById('searchForm');
const details = document.getElementById('details');
const restName = document.getElementById('rest-name');
const restDesc = document.getElementById('rest-desc');
const ratingsEl = document.getElementById('ratings');
const restIconContainer = document.getElementById('rest-icon-container');
const avgRating = document.getElementById('avgRating');
const sortSelect = document.getElementById('sortSelect');
const message = document.getElementById('message');

let restaurants = [];

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

async function loadRestaurants(){
  try{
    const res = await fetch('/api/restaurants');
    restaurants = await res.json();
    restaurantsList.innerHTML = '';
    restaurants.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.restaurant_name;
      restaurantsList.appendChild(opt);
    });
  }catch(err){
    console.error(err);
    showMessage('Could not load restaurants. Make sure the server is running.');
  }
}

// Load top rated restaurants and render tiles
async function loadTopRated(){
  try{
    const res = await fetch('/api/restaurants/top?limit=3');
    if(!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('topTiles');
    if(!container) return;
    container.innerHTML = '';
    list.forEach(r => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      const iconHtml = r.restaurant_icon 
        ? `<img src="/icons/${r.restaurant_icon}" alt="${r.restaurant_name}" class="tile-icon">`
        : `<span class="tile-icon-placeholder">🍽️</span>`;
      tile.innerHTML = `
        <div class="tile-icon-container">${iconHtml}</div>
        <div class="tile-info">
          <h3>${r.restaurant_name}</h3>
          <div class="avg" title="${Number(r.avg_rating).toFixed(2)}/5">${renderStars(r.avg_rating)}</div>
          <div class="rating-info">
            <span class="rating-value">${Number(r.avg_rating).toFixed(2)}</span>
            <span class="count">(${r.cnt} ratings)</span>
          </div>
        </div>
      `;
      tile.addEventListener('click', () => fetchAndShowById(r.restaurant_id));
      container.appendChild(tile);
    });
  }catch(err){
    console.error('Failed to load top rated', err);
  }
}

function showMessage(txt){
  message.textContent = txt || '';
}

// Fetch and show restaurant details by id
// It will call server api to get restaurant details and ratings, the returned data is a JSON object like:
// {
//   restaurant: { restaurant_id, restaurant_name, restaurant_description },
//   ratings: [ { rating_date, rating, comment }, ... ]
// }
async function fetchAndShowById(id){
  try{
    const res = await fetch(`/api/restaurant/${id}`);
    if(!res.ok){
      showMessage('Failed to fetch restaurant details');
      return;
    }
    const payload = await res.json();
    renderDetails(payload);
  }catch(err){
    console.error(err);
    showMessage('Network error while fetching details');
  }
}

let currentRows = [];
let currentSort = 'date_desc';

function parseRatingDate(value){
  // Accept ISO (contains 'T') or DD/MM/YYYY HH:MM:SS
  if (!value) return new Date(0);
  if (value.includes('T')) return new Date(value);
  // DD/MM/YYYY HH:MM:SS
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3]);
    const hh = Number(m[4]), mm = Number(m[5]), ss = Number(m[6]);
    return new Date(y, mo, d, hh, mm, ss);
  }
  // Fallback
  return new Date(value);
}

function sortRows(rows, sortKey){
  const copy = rows.slice();
  if (sortKey === 'date_desc'){
    copy.sort((a,b)=> parseRatingDate(b.rating_date) - parseRatingDate(a.rating_date));
  } else if (sortKey === 'date_asc'){
    copy.sort((a,b)=> parseRatingDate(a.rating_date) - parseRatingDate(b.rating_date));
  } else if (sortKey === 'rating_desc'){
    copy.sort((a,b)=> Number(b.rating) - Number(a.rating));
  } else if (sortKey === 'rating_asc'){
    copy.sort((a,b)=> Number(a.rating) - Number(b.rating));
  }
  return copy;
}

function toggleSortBy(column){
  if (column === 'date'){
    currentSort = currentSort === 'date_desc' ? 'date_asc' : 'date_desc';
  } else if (column === 'rating'){
    currentSort = currentSort === 'rating_desc' ? 'rating_asc' : 'rating_desc';
  }
  const sorted = sortRows(currentRows, currentSort);
  renderRatingsTable(sorted);
}

function renderRatingsTable(rows){
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Date header (clickable)
  const thDate = document.createElement('th');
  thDate.style.cursor = 'pointer';
  thDate.innerHTML = 'Date';
  const dateIndicator = document.createElement('span');
  dateIndicator.className = 'sort-indicator';
  dateIndicator.style.marginLeft = '6px';
  if (currentSort.startsWith('date')) dateIndicator.textContent = currentSort === 'date_desc' ? '↓' : '↑';
  thDate.appendChild(dateIndicator);
  thDate.addEventListener('click', () => toggleSortBy('date'));
  headerRow.appendChild(thDate);

  // Rating header (clickable)
  const thRating = document.createElement('th');
  thRating.style.cursor = 'pointer';
  thRating.innerHTML = 'Rating';
  const ratingIndicator = document.createElement('span');
  ratingIndicator.className = 'sort-indicator';
  ratingIndicator.style.marginLeft = '6px';
  if (currentSort.startsWith('rating')) ratingIndicator.textContent = currentSort === 'rating_desc' ? '↓' : '↑';
  thRating.appendChild(ratingIndicator);
  thRating.addEventListener('click', () => toggleSortBy('rating'));
  headerRow.appendChild(thRating);

  // Comment header (non-clickable)
  const thComment = document.createElement('th');
  thComment.textContent = 'Comment';
  headerRow.appendChild(thComment);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const starRating = renderStars(r.rating);
    tr.innerHTML = `<td>${r.rating_date}</td><td><span title="${Number(r.rating).toFixed(1)}/5">${starRating}</span></td><td>${r.comment || ''}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  ratingsEl.innerHTML = '';
  ratingsEl.appendChild(table);
}

function renderDetails(payload){
  if(!payload || !payload.restaurant) return;
  details.classList.remove('hidden');

  // Display restaurant icon and description
  const restaurant = payload.restaurant;
  if(restaurant.restaurant_icon){
    restIconContainer.innerHTML = `<img src="/icons/${restaurant.restaurant_icon}" alt="${restaurant.restaurant_name}" class="tile-icon">`;
  }else{
    restIconContainer.innerHTML = '<span class="tile-icon-placeholder">🍽️</span>';
  }
  restName.textContent = payload.restaurant.restaurant_name;
  restDesc.textContent = payload.restaurant.restaurant_description || '';

  currentRows = payload.ratings || [];
  if(currentRows.length === 0){
    avgRating.textContent = '';
    ratingsEl.innerHTML = '<p>No ratings available.</p>';
    return;
  }

  // Calculate and show average rating
  const avg = currentRows.reduce((sum, r) => sum + Number(r.rating), 0) / currentRows.length;
  const starRating = renderStars(avg);
  avgRating.innerHTML = `<strong>${starRating}</strong> <span class="rating-detail">${avg.toFixed(2)}/5 (${currentRows.length} ratings)</span>`;

  const sorted = sortRows(currentRows, currentSort);
  renderRatingsTable(sorted);
}

form.addEventListener('submit', e =>{
  e.preventDefault();
  const q = input.value.trim();
  if(!q){ showMessage('Please enter a restaurant name.'); return; }
  const found = restaurants.find(r => r.restaurant_name === q);
  if(!found){ showMessage('No restaurant found with that name (select from suggestions).'); return; }
  showMessage('');
  fetchAndShowById(found.restaurant_id);
});

// Listen to sort changes
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    if (currentRows && currentRows.length > 0) {
      const sorted = sortRows(currentRows, currentSort);
      renderRatingsTable(sorted);
    }
  });
}



// Init
loadRestaurants();
loadTopRated();
