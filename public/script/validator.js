// Rules implementation
function isValid(value, type) {
    if (!(value && value.trim().length > 0)) return -1;

    var val = value.trim();
    var ret = false;

    if (type === 'email') {
        ret = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val.toLowerCase());
    } 
    else if (type === 'username') {
        ret = /^[0-9a-zA-Z_-]+$/.test(value);
    }
    else if (type === 'phone') {
        ret = (val.length > 3) && (/^\d+$/.test(value));
    }
    else if (type === 'password') {
        ret = (value.length > 5) && (value.length < 17);
    }
    else ret = val.length > 1; // fullname
    
    return ret ? 1 : 0;
}


// Check rule and show error message for each input element
function validate(inputElement, type) {
    var parentElement = inputElement.parentElement;
    var errorElement = parentElement.querySelector('.form-message');
    var errorMessage = '';
    var rule = isValid(inputElement.value, type);
    if (rule < 0) {
        parentElement.classList.add('invalid');
        errorMessage = 'Vui lòng nhập trường này';
    }
    else if (rule == 0) {
        parentElement.classList.add('invalid');
        if (type === 'email') {
            errorMessage = 'Email không hợp lệ';
        }
        else if (type === 'username') {
            errorMessage = "Username chỉ bao gồm chữ cái, số, '_', '-'";
        }
        else if (type === 'phone') {
            errorMessage = 'Sô điện thoại không hợp lệ';
        }
        else if (type === 'password') {
            errorMessage = 'Mật khẩu phải từ 6 đến 16 ký tự';
        }
        else errorMessage = 'Tên phải có ít nhất 2 ký tự';
    }
    else {
        parentElement.classList.remove('invalid');
        errorElement.innerText = '';
        return 1;
    }
    errorElement.innerText = errorMessage;
    return 0;
}

// Validate login form
function validateLogin() {
    var formElement = document.querySelector('#form-login');
    var check = 0;
    if (formElement) {
        check = 1;
        check &= validate(formElement.querySelector('#login-email'), 'email');
        check &= validate(formElement.querySelector('#login-password'), 'password');
    }
    return check == 1;
}

// Validate register form
function validateRegister() {
    var formElement = document.querySelector('#form-register');
    var check = 0;
    if (formElement) {
        check = 1;
        check &= validate(formElement.querySelector('#fullname'), 'fullname');
        check &= validate(formElement.querySelector('#username'), 'username');
        check &= validate(formElement.querySelector('#register-email'), 'email');
        check &= validate(formElement.querySelector('#phone'), 'phone');
        var pass1 = formElement.querySelector('#register-password');
        var pass2 = formElement.querySelector('#password-again');
        var validPass1 = validate(pass1, 'password');
        var validPass2 = validate(pass2, 'password');
        check &= validPass1 & validPass2;

        // check 2 pass are same
        if (validPass1 && validPass2) {
            if (pass2.value.localeCompare(pass1.value) != 0) {
                var errorElement = pass2.parentElement.querySelector('.form-message');
                pass2.parentElement.classList.add('invalid');
                errorElement.innerText = 'Mật khẩu không đồng nhất';
                check = 0;
            } 
        }
    }
    return check == 1;
}

// Clear all error message on focus
document.querySelector('#form-login').querySelectorAll('.form-message').forEach(element => {
    element.parentElement.querySelector('input').onfocus = () => {
        element.innerHTML = '';
        element.parentElement.classList.remove('invalid');
    }
});
document.querySelector('#form-register').querySelectorAll('.form-message').forEach(element => {
    element.parentElement.querySelector('input').onfocus = () => {
        element.innerHTML = '';
        element.parentElement.classList.remove('invalid');
    }
});