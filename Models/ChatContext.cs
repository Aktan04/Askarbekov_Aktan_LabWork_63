using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AjaxChat.Models;

public class ChatContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public ChatContext(DbContextOptions<ChatContext> options) : base(options){}
    
    public DbSet<User> Users { get; set; }
}