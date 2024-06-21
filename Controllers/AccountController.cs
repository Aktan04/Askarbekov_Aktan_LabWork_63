using AjaxChat.Models;
using AjaxChat.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SignInResult = Microsoft.AspNetCore.Identity.SignInResult;

namespace AjaxChat.Controllers;

public class AccountController : Controller
{
    public ChatContext _context;
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IWebHostEnvironment _hostEnvironment;
    
    public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, IWebHostEnvironment hostEnvironment, ChatContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _hostEnvironment = hostEnvironment;
        _context = context;
    }
    [Authorize]
    public async Task<IActionResult> Profile(int? userId)
    {
        if (userId != null)
        {
            var getUser = await _context.Users.Include(u => u.Messages).FirstOrDefaultAsync(u => u.Id == userId);
            return View(getUser);
        }
        int? targetUserId = Convert.ToInt32(_userManager.GetUserId(User));
        var user = await _context.Users.Include(u => u.Messages).FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null)
        {
            return NotFound("Пользователь не найден");
        }

        return View(user);
    }
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> EditProfile(int userId, string nickName, string email, string userName, DateTime birthdate, IFormFile imageFile, bool isAdmin, string password, string confirmPassword)
    {
        int? targetUserId = Convert.ToInt32(_userManager.GetUserId(User));
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Id == targetUserId);
        if (User.IsInRole("admin"))
        {
         currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }
        if (currentUser == null)
        {
            return NotFound(); 
        }
        if (_context.Users.Any(u => u.Email == email && u.Id != userId) || 
        _context.Users.Any(u => u.UserName == userName && u.Id != userId))
        {
            ModelState.AddModelError(string.Empty, "Логин или Email уже существует");
            return Json(new { success = false, error = "Логин или Email уже существует" });
        }
        if (!string.IsNullOrEmpty(password))
        {
            if (password != confirmPassword)
            {
              return Json(new { success = false, error = "Пароли не совпадают" });
            }

            currentUser.PasswordHash = password != null
                ? _userManager.PasswordHasher.HashPassword(currentUser, password)
                : currentUser.PasswordHash;
        }
        try
        {
            if (imageFile != null && imageFile.Length > 0)
            {
                var uploadPath = Path.Combine(_hostEnvironment.WebRootPath, "images");
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(imageFile.FileName);
                var fullPath = Path.Combine(uploadPath, fileName);
                
                using (var fileStream = new FileStream(fullPath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(fileStream);
                }
                
                currentUser.Avatar = "/images/" + fileName;
            }
            currentUser.NickName = nickName;
            currentUser.Email = email; 
            currentUser.UserName = userName;
            currentUser.Birthdate = birthdate.AddHours(6).ToUniversalTime();
            var result = await _userManager.UpdateAsync(currentUser);
            if (result.Succeeded)
            {
                return Json(new { success = true, user =  currentUser, isAdmin = isAdmin}); 
            }
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
            return Json(new { success = false, error = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }
        catch (Exception ex)
        {
            return Json(new { success = false, error = ex.Message }); 
        }
    }

    [Authorize(Roles = "admin")]
    public IActionResult Index()
    {
        if (User.Identity.IsAuthenticated)
        {
            if (User.IsInRole("admin"))
            {
                var users = _context.Users.Where(u => u.Id > 1).ToList();
                return View(users);
            }
        }

        return NotFound();
    }
    
    
    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Block(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return NotFound();
        }

        user.IsBlocked = !user.IsBlocked;
        if (user.IsBlocked == true)
        {
            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.MaxValue;
        }
        else
        {
            user.LockoutEnabled = false;
            user.LockoutEnd = null;
        }

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return Json(new { isBlocked = user.IsBlocked });
    }
    [HttpGet]
    public IActionResult Login(string returnUrl = null)
    {
       return View(new LoginViewModel(){ReturnUrl = returnUrl});
    }
    
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (ModelState.IsValid)
        {
            User? user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(model.Email);
            }
            if (user != null)
            {
                if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow)
                {
                    ModelState.AddModelError("", "Ваш аккаунт заблокирован.");
                    return View(model);
                }
                SignInResult result = await _signInManager.PasswordSignInAsync(user, model.Password, false, true);
                if (result.Succeeded)
                {
                    if (!string.IsNullOrEmpty(model.ReturnUrl) && Url.IsLocalUrl(model.ReturnUrl))
                    {
                        Redirect(model.ReturnUrl);
                    }

                    return RedirectToAction("Profile", "Account");
                }
            }
            ModelState.AddModelError("", "Invalid email or password");
        }

        return View(model);
    }
    
    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (model.ImageFile == null)
        {
            ModelState.AddModelError("ImageFile", "Картинка обязательна для скачивания");
            return View(model);
        }

        User? findUserWithEmail = _context.Users.FirstOrDefault(u => u.Email == model.Email);
        User? findUserWithUserName = _context.Users.FirstOrDefault(u => u.UserName == model.UserName);
        if (findUserWithEmail != null || findUserWithUserName != null)
        {
            ModelState.AddModelError("UserName", "Логин или Email уже существует");
            return View(model);
        }
        if (ModelState.IsValid)
        {
            if (model.ImageFile != null && model.ImageFile.Length > 0)
            {
                
                var uploadPath = Path.Combine(_hostEnvironment.WebRootPath, "images");
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(model.ImageFile.FileName);
                var fullPath = Path.Combine(uploadPath, fileName);
            
                using (var fileStream = new FileStream(fullPath, FileMode.Create))
                {
                    await model.ImageFile.CopyToAsync(fileStream);
                }
            
                model.Avatar = "/images/" + fileName;
            }
            User user = new User()
            {
                Email = model.Email,
                UserName = model.UserName,
                Avatar = model.Avatar,
                NickName = model.NickName,
                Birthdate = model.BirthDate.ToUniversalTime(),
                IsBlocked = false
            };
            var result = await _userManager.CreateAsync(user, model.Password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "user");
                if (!User.IsInRole("admin"))
                {
                    await _signInManager.SignInAsync(user, false);
                }
                return RedirectToAction("Profile", "Account");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        return View(model);
    }

    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return RedirectToAction("Login", "Account");
    }

    public async Task<IActionResult> AccessDenied(string returnUrl = null)
    {
        return RedirectToAction("Login", new { returnUrl = returnUrl });
    }
}