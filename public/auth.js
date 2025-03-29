// REGISTER USER
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const flatNumber = document.getElementById('flatNumber').value.trim().toUpperCase();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const errorElem = document.getElementById('registerError');

    // ✅ Check if passwords match
    if (password !== confirmPassword) {
        errorElem.textContent = '❌ Passwords do not match!';
        return;
    }

    // ✅ Validate flat number (A101 - A510)
    const validFlats = [];
    for (let floor = 1; floor <= 5; floor++) {
        for (let flat = 1; flat <= 10; flat++) {
            validFlats.push(`A${floor}0${flat}`);
        }
    }
    
    if (!validFlats.includes(flatNumber)) {
        errorElem.textContent = `❌ Invalid flat number! Choose between A101 - A510.`;
        return;
    }

    try {
        const response = await axios.post('http://localhost:5000/api/users/register', {
            username, email, password, flatNumber, phoneNumber
        });

        alert('✅ Registration successful! Please wait for admin approval.');
        window.location.href = "login.html";
    } catch (error) {
        console.error('❌ Registration error:', error);
        errorElem.textContent = error.response?.data?.message || '❌ Registration failed!';
    }
});

// LOGIN USER
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElem = document.getElementById('loginError');

    try {
        const response = await axios.post('http://localhost:5000/api/users/login', { username, password });

        if (!response.data.user.isApproved) {
            errorElem.textContent = '⏳ Your registration is pending admin approval!';
            return;
        }

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        window.location.href = "home.html";
    } catch (error) {
        console.error('❌ Login error:', error);
        errorElem.textContent = error.response?.data?.message || '❌ Login failed!';
    }
});


// LOGOUT FUNCTION
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
