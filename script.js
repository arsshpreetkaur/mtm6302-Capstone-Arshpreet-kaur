const API_KEY = '0bSWftbvzbajghB6ydst7zx6i89Kz5o82qGnncd8'; // Replace with your NASA API key
const API_URL = 'https://api.nasa.gov/planetary/apod?api_key=' + API_KEY;
const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let currentSearchResults = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date-form').addEventListener('submit', fetchAPODByDate);
    document.getElementById('search-form').addEventListener('submit', searchAPOD);
    document.getElementById('view-slideshow').addEventListener('click', viewSlideshow);
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
    displayFavourites();
    updateFavouritesCount();
    applyDarkMode();
});

async function fetchAPODByDate(event) {
    event.preventDefault();
    const date = document.getElementById('date-input').value;
    if (!date) return;

    const response = await fetch(`${API_URL}&date=${date}`);
    const data = await response.json();
    displayAPOD(data);
}

async function searchAPOD(event) {
    event.preventDefault();
    const keyword = document.getElementById('keyword-input').value;
    if (!keyword) return;

    const response = await fetch(`https://images-api.nasa.gov/search?q=${keyword}&media_type=image`);
    const data = await response.json();
    currentSearchResults = data.collection.items.map(item => ({
        title: item.data[0].title,
        url: item.links[0].href,
        date: item.data[0].date_created.split('T')[0],
        explanation: item.data[0].description,
        media_type: 'image'
    }));

    displaySearchResults();
}

function displayAPOD(data) {
    const apodContainer = document.getElementById('apod-container');
    apodContainer.innerHTML = `
        <div class="apod-card">
            ${data.media_type === 'video' ? `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>` : `<img src="${data.url}" alt="${data.title}" id="apod-image">`}
            <h2>${data.title}</h2>
            <p>${data.date}</p>
            <p>${data.explanation}</p>
            <button onclick="addFavourite('${data.url}', '${data.title}', '${data.date}', '${data.explanation}', '${data.media_type}')">Add to Favourites</button>
            <button class="share-apod" onclick="shareAPOD('${data.url}', '${data.title}')">Share</button>
        </div>
    `;
    if (data.media_type !== 'video') {
        document.getElementById('apod-image').addEventListener('click', () => {
            window.open(data.hdurl || data.url, '_blank');
        });
    }
}

function displaySearchResults() {
    const searchResultsContainer = document.getElementById('search-results-container');
    const paginationContainer = document.getElementById('pagination-container');

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedResults = currentSearchResults.slice(startIndex, endIndex);

    searchResultsContainer.innerHTML = paginatedResults.map(result => `
        <div class="search-result-card">
            ${result.media_type === 'video' ? `<iframe src="${result.url}" frameborder="0" allowfullscreen></iframe>` : `<img src="${result.url}" alt="${result.title}">`}
            <h2>${result.title}</h2>
            <p>${result.date}</p>
            <p>${result.explanation}</p>
            <button onclick="addFavourite('${result.url}', '${result.title}', '${result.date}', '${result.explanation}', '${result.media_type}')">Add to Favourites</button>
            <button class="share-apod" onclick="shareAPOD('${result.url}', '${result.title}')">Share</button>
        </div>
    `).join('');

    const totalPages = Math.ceil(currentSearchResults.length / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = Array.from({ length: totalPages }, (_, index) => `
        <button ${index + 1 === currentPage ? 'disabled' : ''} onclick="changePage(${index + 1})">${index + 1}</button>
    `).join('');
}

function changePage(page) {
    currentPage = page;
    displaySearchResults();
}

function addFavourite(url, title, date, explanation, mediaType) {
    const favourite = { url, title, date, explanation, media_type: mediaType };
    favourites.push(favourite);
    localStorage.setItem('favourites', JSON.stringify(favourites));
    displayFavourites();
    updateFavouritesCount();
}

function displayFavourites() {
    const favouritesContainer = document.getElementById('favourites-container');
    favouritesContainer.innerHTML = '';
    favourites.forEach((favourite, index) => {
        const favouriteCard = document.createElement('div');
        favouriteCard.classList.add('favourite-card');
        favouriteCard.innerHTML = `
            ${favourite.media_type === 'video' ? `<iframe src="${favourite.url}" frameborder="0" allowfullscreen></iframe>` : `<img src="${favourite.url}" alt="${favourite.title}" class="favourite-image">`}
            <h2>${favourite.title}</h2>
            <p>${favourite.date}</p>
            <p>${favourite.explanation}</p>
            <button class="remove-favourite" onclick="removeFavourite(${index})">Remove</button>
        `;
        favouritesContainer.appendChild(favouriteCard);
    });
}

function removeFavourite(index) {
    favourites.splice(index, 1);
    localStorage.setItem('favourites', JSON.stringify(favourites));
    displayFavourites();
    updateFavouritesCount();
}

function updateFavouritesCount() {
    const favouritesCount = document.getElementById('favourites-count');
    favouritesCount.textContent = `(${favourites.length})`;
}

function viewSlideshow() {
    if (favourites.length === 0) {
        alert('No favourites to display');
        return;
    }
    
    let currentIndex = 0;
    const slideshowInterval = setInterval(() => {
        const favourite = favourites[currentIndex];
        displayAPOD(favourite);
        currentIndex = (currentIndex + 1) % favourites.length;
    }, 3000);
    
    setTimeout(() => clearInterval(slideshowInterval), favourites.length * 3000);
}

function shareAPOD(url, title) {
    const shareData = {
        title: 'Astronomy Picture of the Day',
        text: title,
        url: url
    };
    
    if (navigator.share) {
        navigator.share(shareData).then(() => {
            console.log('APOD shared successfully');
        }).catch(console.error);
    } else {
        alert('Sharing not supported on this browser');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
}

function applyDarkMode() {
    const darkMode = JSON.parse(localStorage.getItem('dark-mode'));
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}
