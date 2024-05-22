using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc;

namespace AjaxChat.ViewModels;

public class RegisterViewModel
{
    [Required(ErrorMessage = "Не указан Email")]
    [DataType(DataType.EmailAddress)]
    [EmailAddress(ErrorMessage = "Некорректный Email пользователя")]
    public string Email { get; set; }
    
    [Required(ErrorMessage = "Не указан логин пользователя")]
    public string UserName { get; set; }
    
    [Required(ErrorMessage = "Не указан пароль")]
    [MinLength(3, ErrorMessage = "Пароль должен содержать не менее 6 символов")]
    /*[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$", ErrorMessage = "Пароль должен содержать минимум 1 цифру, больше 8 символов и одну букву в верхнем регистре")]*/
    [DataType(DataType.Password)]
    public string Password { get; set; }
    
    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "Пароли не совпадают")]
    public string ConfirmPassword { get; set; }
    public string? Avatar { get; set; }
    [NotMapped]
    public IFormFile? ImageFile { get; set; }
    [Required(ErrorMessage = "Имя пользователя обязательно к заполнению")]
    public string NickName { get; set; }
    [Required(ErrorMessage = "Дата рождения пользователя обязательна к заполнению")]
    [Remote(action: "CheckDate", controller: "Validation", ErrorMessage = "Пользовател должен быть старше 18 лет")]
    public DateTime BirthDate { get; set; }
}