function makeRequest(url, method) {
    console.log('Do make request to ' + url + ' ....');

    var jwtToken = localStorage.getItem('token');
    var headers = {}
    if (jwtToken) {
        headers['token'] = jwtToken;
    }
    return fetch(url, {
        method: method, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors',
        headers: headers
    });
}

function logout() {
    localStorage.clear();
    window.location.replace("/logout");
}

var ht = document.querySelector('.header-top');
var htCheckOrder = ht.querySelector('#ht-check-order');
var htLogin = ht.querySelector('#ht-login');
var htAccount = ht.querySelector('#ht-account');
var htLogout = ht.querySelector('#ht-logout');

var jwtToken = localStorage.getItem('token');
var name = localStorage.getItem('name');

if (jwtToken && jwtToken.length) {
    htLogin.classList.add('d-none');
    htCheckOrder.classList.remove('d-none');
    htAccount.classList.remove('d-none');
    htLogout.classList.remove('d-none');
    htAccount.append(name.toUpperCase());
} else {
    htLogin.classList.remove('d-none');
    htCheckOrder.classList.add('d-none');
    htAccount.classList.add('d-none');
    htLogout.classList.add('d-none');
}

function searchBox() {
    var searchBox = document.querySelector('#search-box');
    var query = searchBox.value.trim();
    if (query && query.length > 0) {
        console.log(query);
        window.location.replace("/search?q=" + query);
    }
}

// Process like button
var likeProductIDs = JSON.parse(localStorage.getItem('likeProductIDs'));
document.querySelectorAll('.card-btn-wish').forEach(btn => {
    let id = parseInt(btn.name.split('-')[2]);
    if (likeProductIDs && likeProductIDs.includes(id)) {
        btn.className = "card-btn-wish in-wish-list";
        btn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        btn.className = "card-btn-wish";
        btn.innerHTML = '<i class="fal fa-heart"></i>';
    }
});