using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.Extensions.DependencyInjection;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Entity;
using SaasV2.Mapping;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SaasV2.DAL
{
    public class BaseContext : IdentityDbContext<AppUser, AppRole, Guid>, IEFContext
    {
        private readonly IServiceProvider _serviceProvider;

        public BaseContext(DbContextOptions options, IServiceProvider serviceProvider = null) : base(options)
        {
            _serviceProvider = serviceProvider;
        }

        private IHttpContextAccessor GetHttpContextAccessor()
        {
            return _serviceProvider?.GetService<IHttpContextAccessor>();
        }
        public override DbSet<TEntity> Set<TEntity>() where TEntity : class
        {
            return base.Set<TEntity>();
        }

        async Task<int> IEFContext.SaveChangesAsync(CancellationToken cancellationToken)
        {
            string processId = Guid.NewGuid().ToString().Replace("-", "") + DateTime.Now.ToBinary();
            DateTime now = DateTime.UtcNow;

            // Değişiklikleri kaydet (loglama için)
            var changes = new List<(IEntity entity, EntityState state, string? oldValues, string? newValues)>();
            
            foreach (var entry in ChangeTracker.Entries<IEntity>())
            {
                if (entry.State == EntityState.Added || entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
                {
                    // ActivityLog için değişiklikleri ÖNCE kaydet (ModifiedDate değiştirilmeden önce)
                    // ActivityLog hariç - sonsuz döngüyü önlemek için
                    if (entry.Entity is not ActivityLog)
                    {
                        string? oldValues = null;
                        string? newValues = null;

                        if (entry.State == EntityState.Modified)
                        {
                            oldValues = JsonSerializer.Serialize(entry.OriginalValues.Properties
                                .ToDictionary(p => p.Name, p => entry.OriginalValues[p]?.ToString() ?? "null"));
                            newValues = JsonSerializer.Serialize(entry.CurrentValues.Properties
                                .ToDictionary(p => p.Name, p => entry.CurrentValues[p]?.ToString() ?? "null"));
                        }
                        else if (entry.State == EntityState.Added)
                        {
                            newValues = JsonSerializer.Serialize(entry.CurrentValues.Properties
                                .ToDictionary(p => p.Name, p => entry.CurrentValues[p]?.ToString() ?? "null"));
                        }
                        else if (entry.State == EntityState.Deleted)
                        {
                            oldValues = JsonSerializer.Serialize(entry.OriginalValues.Properties
                                .ToDictionary(p => p.Name, p => entry.OriginalValues[p]?.ToString() ?? "null"));
                        }

                        changes.Add((entry.Entity, entry.State, oldValues, newValues));
                    }

                    // ModifiedDate güncellemeleri (ActivityLog değişikliklerinden SONRA)
                    if (entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
                    {
                        // ModifiedDate'i güncelle
                        entry.Entity.ModifiedDate = now;
                        
                        // EF Core'a ModifiedDate'in değiştiğini açıkça bildir
                        // Ancak sadece Modified state'inde ve property mevcutsa
                        if (entry.State == EntityState.Modified)
                        {
                            try
                            {
                                var modifiedDateProperty = entry.Property("ModifiedDate");
                                if (modifiedDateProperty != null)
                                {
                                    modifiedDateProperty.IsModified = true;
                                }
                            }
                            catch
                            {
                                // Property bulunamazsa veya başka bir sorun varsa devam et
                                // ModifiedDate zaten set edildi, EF Core bunu algılayabilir
                            }
                        }
                    }
                    
                    if (entry.State == EntityState.Added)
                    {
                        entry.Entity.CreatedDate = now;
                        entry.Entity.ModifiedDate = now; // Added durumunda da ModifiedDate = CreatedDate
                        entry.Entity.Status = Status.Active;
                    }
                }
            }

            int rowCount = 0;

            try
            {
                rowCount = await base.SaveChangesAsync(cancellationToken);

                // Değişikliklerden sonra ActivityLog kayıtları oluştur
                var httpContextAccessor = GetHttpContextAccessor();
                if (changes.Any() && httpContextAccessor?.HttpContext != null)
                {
                    await CreateActivityLogsAsync(changes, processId, now, httpContextAccessor);
                    await base.SaveChangesAsync(cancellationToken); // ActivityLog'ları kaydet
                }
            }
            catch (Exception ex)
            {
                // Inner exception'ı da göster
                var errorMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    errorMessage += $" Inner Exception: {ex.InnerException.Message}";
                }
                throw new Exception(errorMessage, ex);
            }

            return rowCount;
        }

        private async Task CreateActivityLogsAsync(
            List<(IEntity entity, EntityState state, string? oldValues, string? newValues)> changes,
            string processId,
            DateTime now,
            IHttpContextAccessor httpContextAccessor)
        {
            var httpContext = httpContextAccessor.HttpContext;
            
            // API Key authentication kullanılıyorsa UserId null olmalı (AppId değil)
            var authenticationScheme = httpContext?.User?.Identity?.AuthenticationType;
            bool isApiKeyAuth = authenticationScheme == "ApiKey";
            
            Guid? userIdGuid = null;
            
            if (!isApiKeyAuth && httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userId, out var uid))
                {
                    // Bu ID'nin gerçekten AspNetUsers tablosunda olup olmadığını kontrol et
                    var userExists = await Set<AppUser>().AnyAsync(u => u.Id == uid);
                    if (userExists)
                    {
                        userIdGuid = uid;
                    }
                }
            }

            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

            foreach (var (entity, state, oldValues, newValues) in changes)
            {
                string action = state switch
                {
                    EntityState.Added => "Create",
                    EntityState.Modified => "Update",
                    EntityState.Deleted => "Delete",
                    _ => "Unknown"
                };

                string entityType = entity.GetType().Name;
                string description = $"{action} {entityType}";

                // Entity'den AppId çıkar (eğer varsa)
                Guid? appId = null;
                var appIdProperty = entity.GetType().GetProperty("AppId");
                if (appIdProperty != null && appIdProperty.GetValue(entity) is Guid appIdValue)
                {
                    appId = appIdValue;
                }

                var log = new ActivityLog
                {
                    Id = Guid.NewGuid(),
                    Status = Status.Active,
                    CreatedDate = now,
                    ModifiedDate = now,
                    UserId = userIdGuid,
                    AppId = appId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entity.Id,
                    Description = description,
                    OldValues = oldValues,
                    NewValues = newValues,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    RequestId = processId,
                };

                Set<ActivityLog>().Add(log);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //Mapping İşlemleri
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(BaseMap<IEntity>).Assembly);


            base.OnModelCreating(modelBuilder);
        }
    }
}
