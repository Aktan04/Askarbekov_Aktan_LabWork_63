using AjaxChat.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AjaxChat.Controllers;

public class ChatController : Controller
{
    public ChatContext _context;
    private readonly UserManager<User> _userManager;

    public ChatController(ChatContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }
    [Authorize]
    public async Task<IActionResult> Index()
    {
        int? userId = Convert.ToInt32(_userManager.GetUserId(User));
        ViewBag.TargetUser = userId;
        var messages = await _context.Messages
            .Include(m => m.User)
            .OrderByDescending(m => m.DateOfSend)
            .Take(30)
            .ToListAsync();
        messages.Reverse(); 
        return View(messages);
    }
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> SendMessage(string text)
    {
        if (text.Length > 100)
        {
            return BadRequest("Сообщение слишком длинное");
        }

        int? userId = Convert.ToInt32(_userManager.GetUserId(User));
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        ViewBag.TargetUser = userId;
        var message = new Message
        {
            Text = text,
            DateOfSend = DateTime.UtcNow,
            UserId = userId.Value,
            User = user
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return PartialView("_MessagePartial", message);
    }
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetMessages()
    {
        int? userId = Convert.ToInt32(_userManager.GetUserId(User));
        ViewBag.TargetUser = userId;
        var messages = await _context.Messages
            .Include(m => m.User)
            .OrderByDescending(m => m.DateOfSend)
            .Take(30)
            .ToListAsync();
        messages.Reverse();
        return PartialView("_MessagesPartial", messages);
    }
    
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        var message = await _context.Messages.FindAsync(messageId);
        if (message == null)
        {
            return NotFound(new { success = false, error = "Сообщение не найдено" });
        }

        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();
        return RedirectToAction("Index");
    }
}
