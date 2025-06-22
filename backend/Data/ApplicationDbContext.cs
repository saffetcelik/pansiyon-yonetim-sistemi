using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Log> Logs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Customer Configuration
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasIndex(e => e.TCKimlikNo).IsUnique();
                entity.HasIndex(e => e.PassportNo).IsUnique();
                entity.HasIndex(e => e.Email);
            });

            // Room Configuration
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasIndex(e => e.RoomNumber).IsUnique();
                entity.Property(e => e.PricePerNight).HasPrecision(10, 2);
            });

            // Reservation Configuration
            modelBuilder.Entity<Reservation>(entity =>
            {
                entity.Property(e => e.TotalAmount).HasPrecision(10, 2);
                entity.Property(e => e.PaidAmount).HasPrecision(10, 2);

                entity.HasOne(e => e.Customer)
                      .WithMany(e => e.Reservations)
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Room)
                      .WithMany(e => e.Reservations)
                      .HasForeignKey(e => e.RoomId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Product Configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.Property(e => e.Price).HasPrecision(10, 2);
                entity.Property(e => e.CostPrice).HasPrecision(10, 2);
                entity.HasIndex(e => e.Barcode).IsUnique();
            });

            // Sale Configuration
            modelBuilder.Entity<Sale>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(10, 2);

                entity.HasOne(e => e.Product)
                      .WithMany(e => e.Sales)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Reservation)
                      .WithMany(e => e.Sales)
                      .HasForeignKey(e => e.ReservationId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // StockTransaction Configuration
            modelBuilder.Entity<StockTransaction>(entity =>
            {
                entity.Property(e => e.UnitCost).HasPrecision(10, 2);

                entity.HasOne(e => e.Product)
                      .WithMany(e => e.StockTransactions)
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Log Configuration
            modelBuilder.Entity<Log>(entity =>
            {
                entity.HasOne(e => e.User)
                      .WithMany(e => e.Logs)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
