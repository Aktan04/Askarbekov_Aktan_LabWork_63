using AjaxChat.Models;
using Microsoft.AspNetCore.Mvc;

namespace AjaxChat.Controllers;

public class ValidationController : Controller
{
    
    [AcceptVerbs("GET", "POST")]
    public bool CheckDate(DateTime BirthDate)
    {
        if (BirthDate > DateTime.Now || BirthDate > DateTime.Now.AddYears(-18))
        {
            return false;
        }

        return true;
    }
}