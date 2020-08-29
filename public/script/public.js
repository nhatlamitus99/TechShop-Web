// All params in localStorage
var jwtToken = localStorage.getItem('token');
var username = localStorage.getItem('username');
var likeProductIDs = localStorage.getItem('likeProductIDs');
var cartProductIDs = localStorage.getItem('cartProductIDs');
if (typeof (likeProductIDs) !== 'undefined' && likeProductIDs) {
    likeProductIDs = JSON.parse(likeProductIDs);
}
if (typeof (cartProductIDs) !== 'undefined' && cartProductIDs) {
    cartProductIDs = JSON.parse(cartProductIDs);
}


function makeRequest(url, method, jwtToken, message) {
    if (typeof (jwtToken) !== 'undefined' && jwtToken && jwtToken.length) {
        console.log('Send ' + method + ' request to ' + url + ' ....');
        var headers = {}
        if (jwtToken) {
            headers['token'] = jwtToken;
        }
        let res = null;
        fetch(url, {
            method: method, // *GET, POST, PUT, DELETE, etc.
            mode: 'cors',
            headers: headers
        }).then(function (response) {
            console.log(response.status);
            if (message) alert(message);
        });
        return true
    }
    console.log('Can not make request.');
    return false;
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
var hm = document.querySelector('.header-middle');
var badgeCart = hm.querySelector('.badge-cartCount');
var badgeLike = hm.querySelector('.badge-likeCount');


if (typeof(jwtToken) !== 'undefined' && jwtToken && jwtToken.length) {
    htLogin.classList.add('d-none');
    htCheckOrder.classList.remove('d-none');
    htAccount.classList.remove('d-none');
    htLogout.classList.remove('d-none');
    htAccount.append(username.toUpperCase());
    badgeLike.classList.remove('d-none');
    badgeCart.classList.remove('d-none');
    badgeCart.innerHTML = 0;
    badgeLike.innerHTML = 0;
    if (likeProductIDs) {
        badgeLike.innerHTML = likeProductIDs.length;
    }
    if (cartProductIDs) {
        badgeCart.innerHTML = cartProductIDs.length;
    }
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

// Show liked button
document.querySelectorAll('.card-btn-wish').forEach(btn => {
    let id = parseInt(btn.name.split('-')[2]);
    if (typeof(likeProductIDs) !== 'undefined' && likeProductIDs && likeProductIDs.includes(id)) {
        btn.className = "card-btn-wish in-wish-list";
        btn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        btn.className = "card-btn-wish";
        btn.innerHTML = '<i class="fal fa-heart"></i>';
    }
});

// When user hit like button on a card product
function hitLike(productID, name = "btn-like-") {
    if (!(typeof(jwtToken) !== 'undefined' && jwtToken && jwtToken.length)) {
        return window.location.replace('/login');
    }
    let _id = parseInt(productID);
    let btnName = name + productID;
    let buttons = document.querySelectorAll('[name=\"' + btnName + '\"]');
    if (typeof (likeProductIDs) !== 'undefined' && likeProductIDs && likeProductIDs.includes(_id)) {
        buttons.forEach(btn => {
            btn.className = "card-btn-wish";
            btn.innerHTML = '<i class="fal fa-heart"></i>';
        });
        makeRequest('/like/' + productID, 'DELETE', jwtToken, 'Đã xóa khỏi Danh sách yêu thích');
        const i = likeProductIDs.indexOf(_id);
        likeProductIDs.splice(i, 1);
        localStorage.setItem("likeProductIDs", JSON.stringify(likeProductIDs));
        badgeLike.innerHTML = parseInt(badgeLike.innerHTML) - 1;
    } else {
        buttons.forEach(btn => {
            btn.className = "card-btn-wish in-wish-list";
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        });
        makeRequest('/like/' + productID, 'PUT', jwtToken, 'Đã thêm vào Danh sách yêu thích');
        if (likeProductIDs) likeProductIDs.push(_id);
        else likeProductIDs = [_id];
        localStorage.setItem("likeProductIDs", JSON.stringify(likeProductIDs));
        badgeLike.innerHTML = parseInt(badgeLike.innerHTML) + 1;
    }
}

// when user hit add to cart button on card product
function hitAddCart(productID, number = 1) {
    if (!(typeof(jwtToken) !== 'undefined' && jwtToken && jwtToken.length)) {
        return window.location.replace('/login');
    }
    let _id = parseInt(productID);
    if (typeof(cartProductIDs) !== 'undefined' && cartProductIDs && cartProductIDs.includes(_id)) {
        alert('Đã có trong Giỏ hàng');
        return;
    }
    let reqUrl = '/cart/' + productID + '?quantity=' + number;
    makeRequest(reqUrl, 'POST', jwtToken, 'Đã thêm vào Giỏ hàng');
    if (cartProductIDs) cartProductIDs.push(_id);
    else cartProductIDs = [_id];
    localStorage.setItem("cartProductIDs", JSON.stringify(cartProductIDs));
    badgeCart.innerHTML = parseInt(badgeCart.innerHTML) + 1;
}