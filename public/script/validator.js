// Rules implementation
function isValid(value, type) {
    if (!(value && value.trim().length)) return -1;

    var val = value.trim();

    if (type === 'email') {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val.toLowerCase());
    } 
    else if (type === 'username') {
        return /^[0-9a-zA-Z_-]+$/.test(value);
    }
    else if (type === 'phone') {
        return (val.length > 3) && (/^\d+$/.test(value));
    }
    else if (type === 'password') {
        return val.length > 5 && value.trim().length < 17;
    }
    return val.length > 1; // fullname
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
            errorMessage = 'Password phải từ 6 đến 16 ký tự';
        }
        else errorMessage = 'Tên phải có ít nhất 2 ký tự';
    }
    else {
        parentElement.classList.remove('invalid');
    }
    errorElement.innerText = errorMessage;
    if (errorMessage.length == 0) return true;
    return false;
}

// Validate login form
function validateLogin() {
    var formElement = document.querySelector('#form-login');
    var check = false;
    if (formElement) {
        check = true;
        check &= validate(formElement.querySelector('#login-email'), 'email');
        check &= validate(formElement.querySelector('#login-password'), 'password');
    }
    return check;
}

// Validate register form
function validateRegister() {
    var formElement = document.querySelector('#form-register');
    var check = false;
    if (formElement) {
        check = true;
        check &= validate(formElement.querySelector('#fullname'), 'fullname');
        check &= validate(formElement.querySelector('#username'), 'username');
        check &= validate(formElement.querySelector('#register-email'), 'email');
        check &= validate(formElement.querySelector('#phone'), 'phone');
        check &= validate(formElement.querySelector('#register-password'), 'password');
        check &= validate(formElement.querySelector('#password-again'), 'password');
    }
    return check;
}