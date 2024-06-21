using AjaxChat.Models;
using AjaxChat.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
string connection = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ChatContext>(options => options.UseNpgsql(connection))
    .AddIdentity<User, IdentityRole<int>>(options =>
    {
        options.Password.RequiredLength = 5;  
        options.Password.RequireNonAlphanumeric = false;   
        options.Password.RequireLowercase = false; 
        options.Password.RequireUppercase = false; 
        options.Password.RequireDigit = false; 
        options.SignIn.RequireConfirmedAccount = true;
    })
    .AddEntityFrameworkStores<ChatContext>()
    .AddDefaultTokenProviders();
var app = builder.Build();
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var userManager = services.GetRequiredService<UserManager<User>>();
    var rolesManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    await AdminInitializer.SeedAdminUser(rolesManager, userManager);
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred while seeding the database.");
}
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Chat}/{action=Index}/{id?}");

app.Run();