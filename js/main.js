// Global variables
let map;
let markers = [];
let infoWindows = [];
let locationsData = null;
let itineraryData = null;
let recommendationsData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeAOS();
    loadData();
});

// Initialize AOS (Animate On Scroll)
function initializeAOS() {
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
}

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Change navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
}

// Load all data files
async function loadData() {
    try {
        const [locationsResponse, itineraryResponse, recommendationsResponse] = await Promise.all([
            fetch('data/locations.json'),
            fetch('data/itinerary.json'),
            fetch('data/recommendations.json')
        ]);

        locationsData = await locationsResponse.json();
        itineraryData = await itineraryResponse.json();
        recommendationsData = await recommendationsResponse.json();

        // Initialize components after data is loaded
        initializeMap();
        loadItinerary();
        loadRecommendations();
        loadTips();

    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('無法載入資料，請稍後重試。');
    }
}

// Initialize Google Maps
function initializeMap() {
    if (!locationsData) return;

    const mapOptions = {
        zoom: 8,
        center: { lat: -27.7, lng: 153.2 }, // Center between Brisbane and Gold Coast
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }, { lightness: 17 }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
            },
            {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 18 }]
            },
            {
                featureType: 'road.local',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 16 }]
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
            }
        ]
    };

    map = new google.maps.Map(document.getElementById('travel-map'), mapOptions);

    // Add markers for all locations
    addMarkersToMap();
    
    // Draw route lines
    drawRoutes();
}

// Add markers to map
function addMarkersToMap() {
    if (!locationsData || !map) return;

    locationsData.locations.forEach((location, index) => {
        const marker = new google.maps.Marker({
            position: location.coordinates,
            map: map,
            title: location.name,
            animation: google.maps.Animation.DROP,
            icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createMarkerSVG(location.icon, getMarkerColor(location.type)))}`,
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(location)
        });

        marker.addListener('click', function() {
            // Close all other info windows
            infoWindows.forEach(window => window.close());
            
            // Open this info window
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        infoWindows.push(infoWindow);

        // Add bounce animation with delay
        setTimeout(() => {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 1000);
        }, index * 200);
    });
}

// Create marker SVG
function createMarkerSVG(icon, color) {
    return `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${icon}</text>
        </svg>
    `;
}

// Get marker color based on type
function getMarkerColor(type) {
    const colors = {
        airport: '#FF6B35',
        accommodation: '#2E8B57',
        education: '#3498DB',
        culture: '#9B59B6',
        entertainment: '#E74C3C',
        attraction: '#27AE60'
    };
    return colors[type] || '#95A5A6';
}

// Create info window content
function createInfoWindowContent(location) {
    return `
        <div style="padding: 10px; max-width: 250px;">
            <h4 style="margin: 0 0 10px 0; color: #2E8B57; font-size: 16px;">${location.name}</h4>
            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${location.description}</p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <span style="font-size: 20px;">${location.icon}</span>
                <span style="margin-left: 8px; color: #999; font-size: 12px;">${getTypeDisplayName(location.type)}</span>
            </div>
        </div>
    `;
}

// Get display name for location type
function getTypeDisplayName(type) {
    const names = {
        airport: '機場',
        accommodation: '住宿',
        education: '教育',
        culture: '文化',
        entertainment: '娛樂',
        attraction: '景點'
    };
    return names[type] || type;
}

// Draw routes between locations
function drawRoutes() {
    if (!locationsData || !map) return;

    const routeColors = ['#2E8B57', '#FF6B35', '#3498DB', '#E74C3C'];
    
    locationsData.route.forEach((route, index) => {
        const fromLocation = locationsData.locations.find(loc => loc.name === route.from);
        const toLocation = locationsData.locations.find(loc => loc.name === route.to);
        
        if (fromLocation && toLocation) {
            const routeLine = new google.maps.Polyline({
                path: [fromLocation.coordinates, toLocation.coordinates],
                geodesic: true,
                strokeColor: routeColors[index % routeColors.length],
                strokeOpacity: 0.8,
                strokeWeight: 3,
                map: map
            });

            // Add route info window
            const routeInfoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px;">
                        <strong>Day ${route.day}</strong><br>
                        ${route.from} → ${route.to}<br>
                        <small>${route.transport}</small>
                    </div>
                `
            });

            routeLine.addListener('click', function(event) {
                routeInfoWindow.setPosition(event.latLng);
                routeInfoWindow.open(map);
            });
        }
    });
}

// Load itinerary timeline
function loadItinerary() {
    if (!itineraryData) return;

    const timeline = document.getElementById('itinerary-timeline');
    timeline.innerHTML = '';

    itineraryData.days.forEach((day, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.setAttribute('data-aos', 'fade-up');
        timelineItem.setAttribute('data-aos-delay', (index * 100).toString());

        timelineItem.innerHTML = `
            <div class="timeline-date">Day ${day.day}</div>
            <div class="timeline-content">
                <div class="day-title">${day.title}</div>
                <div class="day-subtitle">${day.date}</div>
                <ul class="day-activities">
                    ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
                <div class="day-info">
                    <div class="info-box">
                        <h5><i class="fas fa-utensils"></i> 餐食安排</h5>
                        <p><strong>早餐:</strong> ${day.meals.breakfast}</p>
                        <p><strong>午餐:</strong> ${day.meals.lunch}</p>
                        <p><strong>晚餐:</strong> ${day.meals.dinner}</p>
                    </div>
                    <div class="info-box">
                        <h5><i class="fas fa-bed"></i> 住宿資訊</h5>
                        <p>${day.accommodation}</p>
                        <p><strong>地點:</strong> ${day.location}</p>
                    </div>
                </div>
            </div>
        `;

        timeline.appendChild(timelineItem);
    });

    // Refresh AOS for new elements
    AOS.refresh();
}

// Load recommendations
function loadRecommendations() {
    if (!recommendationsData) return;

    // Initialize tabs
    initializeRecommendationTabs();

    // Load restaurants
    loadRestaurants();
    
    // Load attractions
    loadAttractions();
    
    // Load shopping
    loadShopping();
}

// Initialize recommendation tabs
function initializeRecommendationTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Load restaurants
function loadRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    grid.innerHTML = '';

    recommendationsData.restaurants.forEach((restaurant, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${restaurant.name}</div>
                <div class="card-subtitle">${restaurant.location} • ${restaurant.type}</div>
            </div>
            <div class="card-body">
                <div class="card-price">${restaurant.price}</div>
                <div class="card-description">${restaurant.description}</div>
                <div class="card-highlights">
                    ${restaurant.highlights.map(highlight => 
                        `<span class="highlight-tag">${highlight}</span>`
                    ).join('')}
                </div>
                <div class="card-address">
                    <i class="fas fa-map-marker-alt"></i> ${restaurant.address}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Load attractions
function loadAttractions() {
    const grid = document.getElementById('attractions-grid');
    grid.innerHTML = '';

    recommendationsData.attractions.forEach((attraction, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${attraction.name}</div>
                <div class="card-subtitle">${attraction.type}</div>
            </div>
            <div class="card-body">
                <div class="card-price">建議停留: ${attraction.duration}</div>
                <div class="card-description">${attraction.description}</div>
                <div class="card-highlights">
                    ${attraction.highlights.map(highlight => 
                        `<span class="highlight-tag">${highlight}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Load shopping
function loadShopping() {
    const grid = document.getElementById('shopping-grid');
    grid.innerHTML = '';

    recommendationsData.shopping.forEach((shop, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${shop.name}</div>
                <div class="card-subtitle">${shop.location} • ${shop.type}</div>
            </div>
            <div class="card-body">
                <div class="card-description">${shop.description}</div>
                <div class="card-highlights">
                    ${shop.highlights.map(highlight => 
                        `<span class="highlight-tag">${highlight}</span>`
                    ).join('')}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Load tips
function loadTips() {
    if (!recommendationsData) return;

    const grid = document.getElementById('tips-grid');
    grid.innerHTML = '';

    const tipIcons = {
        '交通': 'fas fa-bus',
        '天氣': 'fas fa-sun',
        '文化': 'fas fa-heart',
        '購物': 'fas fa-shopping-cart'
    };

    recommendationsData.tips.forEach((tipCategory, index) => {
        const card = document.createElement('div');
        card.className = 'tips-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());

        card.innerHTML = `
            <div class="tips-icon">
                <i class="${tipIcons[tipCategory.category]}"></i>
            </div>
            <h3 class="tips-title">${tipCategory.category}</h3>
            <ul class="tips-list">
                ${tipCategory.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;

        grid.appendChild(card);
    });
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: #E74C3C;
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility function to handle window resize
window.addEventListener('resize', function() {
    if (map) {
        google.maps.event.trigger(map, 'resize');
    }
});

// Hero scroll animation
document.addEventListener('DOMContentLoaded', function() {
    const heroScroll = document.querySelector('.hero-scroll');
    if (heroScroll) {
        heroScroll.addEventListener('click', function() {
            document.querySelector('#map').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const elementsToObserve = document.querySelectorAll('.timeline-item, .recommendation-card, .tips-card');
    elementsToObserve.forEach(el => observer.observe(el));
});
