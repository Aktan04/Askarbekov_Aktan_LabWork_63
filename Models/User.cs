using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AjaxChat.Models;

public class User : IdentityUser<int>
{
    public string? Avatar { get; set; }
    public string NickName { get; set; }
    public DateTime Birthdate { get; set; }
    [NotMapped]
    public IFormFile? ImageFile { get; set; }
}