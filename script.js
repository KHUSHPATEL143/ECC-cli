const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeiB1ZRTi0fwdecfspbusFmj9OkO61G5-ke7_H_MiCY3il0Vu_ZcXZCyxXwSG6Xro/exec";

// Authentication check
function checkAuthentication() {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'index.html';
    }
}

function signOut() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Display Notifications
async function displayNotifications() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    const container = document.getElementById('notification-banner-container');
    if (!container) return;

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?page=getNotifications&email=${encodeURIComponent(userEmail)}`);
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');

            result.data.forEach(notification => {
                if (!dismissed.includes(notification.id)) {
                    const banner = document.createElement('div');
                    banner.className = 'bg-primary-gold text-deep-navy p-3 text-center relative';
                    banner.innerHTML = `
                        <span>${notification.message}</span>
                        <button onclick="dismissNotification('${notification.id}', this.parentElement)" class="absolute top-1/2 right-4 -translate-y-1/2 font-bold text-lg">&times;</button>
                    `;
                    container.appendChild(banner);
                }
            });
        }
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
    }
}

function dismissNotification(id, bannerElement) {
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
    }
    bannerElement.remove();
}

async function getReturnPercentage() {
    try {
        // We only need dashboard and portfolio data for this calculation
        const [dashboardResponse, portfolioResponse] = await Promise.all([
            fetch(`${APPS_SCRIPT_URL}?page=dashboard`),
            fetch(`${APPS_SCRIPT_URL}?page=portfolio`)
        ]);

        const dashboardResult = await dashboardResponse.json();
        const portfolioResult = await portfolioResponse.json();

        if (dashboardResult.status === 'success' && dashboardResult.data &&
            portfolioResult.status === 'success' && portfolioResult.data) {

            const investedInStocks = dashboardResult.data['Invested in Stocks'] || 0;
            
            const sumOfCurrentHoldings = portfolioResult.data.reduce((sum, holding) => {
                const currentPrice = parseFloat(holding['Current Price']) || 0;
                const shares = parseFloat(holding['Shares']) || 0;
                return sum + (currentPrice * shares);
            }, 0);

            const totalReturn = sumOfCurrentHoldings - investedInStocks;
            
            // Return as a factor, e.g., 0.05 for 5%
            return investedInStocks > 0 ? (totalReturn / investedInStocks) : 0;

        } else {
            console.error('Failed to fetch data for return percentage:', dashboardResult.message, portfolioResult.message);
            return 0; // Default to 0 if data fetch fails
        }
    } catch (error) {
        console.error('Error calculating return percentage:', error);
        return 0; // Default to 0 on error
    }
}

// User Menu Button functionality
function setupUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const userMenuEmail = document.getElementById('user-menu-email');
    
    const userEmail = localStorage.getItem('userEmail');

    if (userEmail) {
        userMenuButton.textContent = userEmail.charAt(0).toUpperCase();
        userMenuEmail.textContent = userEmail;
    }

    userMenuButton.addEventListener('click', function (event) {
        event.stopPropagation();
        userMenuDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', function (event) {
        if (!userMenuButton.contains(event.target) && !userMenuDropdown.contains(event.target)) {
            userMenuDropdown.classList.add('hidden');
        }
    });
}

// Admin Link visibility
function setupAdminLink() {
    if (localStorage.getItem('isAdmin') === 'true') {
        const adminLink = document.getElementById('admin-link');
        if (adminLink) adminLink.style.display = 'flex';
    }
}

// Call common functions on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    setupUserMenu();
    setupAdminLink();
    setTimeout(displayNotifications, 100); // Display notifications after a short delay
});
