$(document).ready(function () {
    $('#togglePassword').click(function () {
        var passwordField = $('#password');
        var fieldType = passwordField.attr('type');
        if (fieldType === 'password') {
            passwordField.attr('type', 'text');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            passwordField.attr('type', 'password');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $('#toggleConfirmPassword').click(function () {
        var confirmPasswordField = $('#confirmPassword');
        var fieldType = confirmPasswordField.attr('type');
        if (fieldType === 'password') {
            confirmPasswordField.attr('type', 'text');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            confirmPasswordField.attr('type', 'password');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $('#confirmPassword').on('input', function () {
        var password = $('#password').val();
        var confirmPassword = $(this).val();
        var errorMessage = $('#errorMessage');
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
    var sendMessageUrl = $('#sendMessageUrl').val();
    var getMessagesUrl = $('#getMessagesUrl').val();

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
        var charCount = $(this).val().length;
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
    $('.edit-profile-btn').click(function () {
        var userId = $(this).data('user-id');
        var nickName = $(this).data('user-nickname');
        var birthdate = $(this).data('user-birthdate');
        var avatar = $(this).data('user-avatar');
        var isAdmin = $(this).data('is-admin');

        $('#editUserId').val(userId);
        $('#editNickName').val(nickName);
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
        $('#editBirthdateValidation').text('');

        var isValid = true;
        var nickName = $('#editNickName').val().trim();
        var birthdate = $('#editBirthdate').val().trim();

        if (!nickName) {
            $('#editNickNameValidation').text('Имя пользователя обязательно к заполнению');
            isValid = false;
        }

        var birthDateObj = new Date(birthdate);
        var age = new Date().getFullYear() - birthDateObj.getFullYear();
        if (!birthdate || age < 18) {
            $('#editBirthdateValidation').text('Пользователь должен быть старше 18 лет');
            isValid = false;
        }

        if (isValid) {
            var formData = new FormData(this);
            $.ajax({
                url: '/Account/EditProfile',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success) {
                        $('#editProfileModal').modal('hide');
                        var updatedUser = response.user;
                        if (!response.isAdmin) {
                            $('#profileNickName').text(updatedUser.nickName);
                            $('#userNickName').text(updatedUser.nickName);
                            $('#userBirthdate').text(new Date(updatedUser.birthdate).toLocaleDateString());
                            if (updatedUser.avatar) {
                                $('.profile-avatar').attr('src', updatedUser.avatar);
                            }
                            $('.edit-profile-btn').data('user-nickname', updatedUser.nickName);
                            $('.edit-profile-btn').data('user-birthdate', updatedUser.birthdate.toISOString().split('T')[0]);
                        } else {
                            var row = $('button[data-user-id="' + updatedUser.id + '"]').closest('tr');
                            row.find('td').eq(3).text(updatedUser.nickName);
                            row.find('td').eq(4).text(new Date(updatedUser.birthdate).toLocaleDateString());
                            if (updatedUser.avatar) {
                                row.find('img').attr('src', updatedUser.avatar);
                            }
                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-nickname', updatedUser.nickName);
                            $('button[data-user-id="' + updatedUser.id + '"]').data('user-birthdate', updatedUser.birthdate.toISOString().split('T')[0]);
                        }
                    } else {
                        console.error('Ошибка при сохранении профиля:', response.error);
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

        var userId = $(this).data('user-id');

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




