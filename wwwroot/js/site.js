$(document).ready(function () {
    $('#togglePassword').click(function () {
        let passwordField = $('#password');
        let fieldType = passwordField.attr('type');
        if (fieldType === 'password') {
            passwordField.attr('type', 'text');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            passwordField.attr('type', 'password');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $('#toggleConfirmPassword').click(function () {
        let confirmPasswordField = $('#confirmPassword');
        let fieldType = confirmPasswordField.attr('type');
        if (fieldType === 'password') {
            confirmPasswordField.attr('type', 'text');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            confirmPasswordField.attr('type', 'password');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $('#confirmPassword').on('input', function () {
        let password = $('#password').val();
        let confirmPassword = $(this).val();
        let errorMessage = $('#errorMessage');
        if (password !== confirmPassword && confirmPassword.length >= 6) {
            errorMessage.html('Пароли не совпадают').show();
            $('#password, #confirmPassword').addClass('border border-danger');
        } else {
            errorMessage.hide();
            $('#password, #confirmPassword').removeClass('border border-danger');
        }
    });
});

$(document).ready(function () {
    let sendMessageUrl = $('#sendMessageUrl').val();
    let getMessagesUrl = $('#getMessagesUrl').val();

    $('#sendMessage').click(function () {
        var text = $('#messageText').val();
        if (text.trim().length === 0) {
            alert('Сообщение не может быть пустым');
            return;
        }

        $.post(sendMessageUrl, { text: text })
            .done(function (data) {
                $('#chat-window').append(data);
                $('#messageText').val('');
                if ($('#chat-window').length) {
                    $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
                }
            })
            .fail(function () {
                alert('Ошибка при отправке сообщения');
            });
    });

    setInterval(function () {
        $.get(getMessagesUrl)
            .done(function (data) {
                $('#chat-window').html(data);
                if ($('#chat-window').length) {
                    $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
                }
            });
    }, 5000);

    if ($('#chat-window').length) {
        $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
    }
});

$(document).ready(function () {
    $('#messageText').on('input', function () {
        let charCount = $(this).val().length;
        $('#charCount').text(charCount + ' / 100');

        if (charCount > 100) {
            $('#messageText').addClass('text-danger');
            $('#errorText').show();
            $('#sendMessage').prop('disabled', true);
        } else {
            $('#messageText').removeClass('text-danger');
            $('#errorText').hide();
            $('#sendMessage').prop('disabled', false);
        }
    });
    
});

$(document).ready(function () {
    function isValidEmail(email) {
        let emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }
    $('.edit-profile-btn').click(function () {
        let userId = $(this).data('user-id');
        let nickName = $(this).data('user-nickname');
        let email = $(this).data('user-email');
        let userName = $(this).data('user-username');
        let birthdate = $(this).data('user-birthdate');
        let avatar = $(this).data('user-avatar');
        let isAdmin = $(this).data('is-admin');

        $('#editUserId').val(userId);
        $('#editNickName').val(nickName);
        $('#editEmail').val(email);
        $('#editUserName').val(userName);
        $('#editBirthdate').val(birthdate);
        $('#editIsAdmin').val(isAdmin);

        if (avatar) {
            $('#editProfileModal .profile-avatar').attr('src', avatar);
        }

        $('#editProfileModal').modal('show');
    });

    $('#editProfileForm').submit(function (event) {
        event.preventDefault();

        $('#editNickNameValidation').text('');
        $('#editEmailValidation').text('');
        $('#editUserNameValidation').text('');
        $('#editBirthdateValidation').text('');
        $('#editPasswordValidation').text('');
        $('#editConfirmPasswordValidation').text('');
        $('#editProfileError').text('');

        let isValid = true;
        let nickName = $('#editNickName').val().trim();
        let email = $('#editEmail').val().trim();
        let userName = $('#editUserName').val().trim();
        let birthdate = $('#editBirthdate').val().trim();
        let password = $('#editPassword').val().trim();
        let confirmPassword = $('#editConfirmPassword').val().trim();

        if (!nickName) {
            $('#editNickNameValidation').text('Имя пользователя обязательно к заполнению');
            isValid = false;
        }

        if (!email) {
            $('#editEmailValidation').text('Email обязателен к заполнению');
            isValid = false;
        }else if (!isValidEmail(email)) { 
            $('#editEmailValidation').text('Некорректный формат Email');
            isValid = false;
        }

        if (!userName) {
            $('#editUserNameValidation').text('Имя пользователя обязательно к заполнению');
            isValid = false;
        }

        let birthDateObj = new Date(birthdate);
        let age = new Date().getFullYear() - birthDateObj.getFullYear();
        if (!birthdate || age < 18) {
            $('#editBirthdateValidation').text('Пользователь должен быть старше 18 лет');
            isValid = false;
        }

        if (password != null && password !== confirmPassword) {
            $('#editConfirmPasswordValidation').text('Пароли не совпадают');
            isValid = false;
        }

        if (isValid) {
            let formData = new FormData(this);
            $.ajax({
                url: '/Account/EditProfile',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success) {
                        $('#editProfileModal').modal('hide');
                        let updatedUser = response.user;
                        if (!response.isAdmin) {
                            $('#profileNickName').text(updatedUser.nickName);
                            $('#profileEmail').text(updatedUser.email);
                            $('#profileUserName').text(updatedUser.userName);
                            $('#userNickName').text(updatedUser.nickName);
                            $('#userBirthdate').text(new Date(updatedUser.birthdate).toLocaleDateString());
                            if (updatedUser.avatar) {
                                $('.profile-avatar').attr('src', updatedUser.avatar);
                            }
                            $('.edit-profile-btn').data('user-nickname', updatedUser.nickName);
                            $('.edit-profile-btn').data('user-email', updatedUser.email);
                            $('.edit-profile-btn').data('user-username', updatedUser.userName);
                            $('.edit-profile-btn').data('user-birthdate', updatedUser.birthdate.toISOString().split('T')[0]);
                        } else {
                            let row = $('button[data-user-id="' + updatedUser.id + '"]').closest('tr');
                            row.find('td').eq(1).html('<a href="/Account/Profile?userId=' + updatedUser.id + '">' + updatedUser.userName + '</a>'); 
                            row.find('td').eq(2).text(updatedUser.email); 
                            row.find('td').eq(3).text(updatedUser.nickName); 
                            row.find('td').eq(4).text(new Date(updatedUser.birthdate).toLocaleDateString());

                            if (updatedUser.avatar) {
                                row.find('img').attr('src', updatedUser.avatar); 
                            } else {
                                row.find('img').attr('src', 'default-avatar.png'); 
                            }

                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-nickname', updatedUser.nickName);
                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-email', updatedUser.email);
                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-username', updatedUser.userName);
                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-birthdate', updatedUser.birthdate.toISOString().split('T')[0]);
                        }

                    } else {
                        $('#editProfileError').text(response.error);
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Ошибка при отправке AJAX-запроса:', error);
                }
            });
        }
    });
});

$(document).ready(function () {
    function updateBlockButton(isBlocked) {
        if (isBlocked) {
            $('#block').removeClass('text-danger').addClass('text-success').text('Unblock');
        } else {
            $('#block').removeClass('text-success').addClass('text-danger').text('Block');
        }
    }

    $('#block').click(function (e) {
        e.preventDefault();

        let userId = $(this).data('user-id');

        $.ajax({
            url: '/Account/Block',
            type: 'POST',
            data: { userId: userId },
            success: function (data) {
                updateBlockButton(data.isBlocked);
            },
            error: function (xhr, status, error) {
                console.error('Ошибка при отправке AJAX-запроса:', error);
            }
        });
    });

    updateBlockButton($('#block').data('is-blocked') === "True");
});

$(document).ready(function() {
    $('#confirmEmail').click(function() {
        let userEmail = $(this).data('user-email');

        $.ajax({
            url: '/Account/SendEmailConfirmation/',
            type: 'POST',
            data: { email: userEmail },
            success: function(response) {
                let responseMessageOfSendEmail = response.message;
                alert(responseMessageOfSendEmail);
            },
            error: function(error) {
                alert('Ошибка при отправке письма.');
            }
        });
    });
    
    $('#requestUserData').click(function() {
        let userId = $(this).data('user-id');
        let userEmail = $(this).data('user-email');

        $.ajax({
            url: '/Account/RequestUserData/',
            type: 'POST',
            data: { userId: userId, userEmail: userEmail },
            success: function(response) {
                let responseMessage = response.message;
                alert(responseMessage);
            },
            error: function(error) {
                alert('An error occurred while requesting user data.');
            }
        });
    });
});


