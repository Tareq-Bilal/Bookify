using Domain.Bookings;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Bookings;

internal sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.ResourceId).HasMaxLength(100);

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(b => b.StartDateTime)
            .HasConversion(d => DateTime.SpecifyKind(d, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        builder.Property(b => b.EndDateTime)
            .HasConversion(d => DateTime.SpecifyKind(d, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        builder.Property(b => b.CreatedAt)
            .HasConversion(d => DateTime.SpecifyKind(d, DateTimeKind.Utc), v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        builder.Property(b => b.CancelledAt)
            .HasConversion(d => d.HasValue ? DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : d, v => v);

        builder.HasIndex(b => new { b.ResourceId, b.StartDateTime, b.EndDateTime });
        builder.HasIndex(b => b.UserId);

        builder.HasOne<User>().WithMany().HasForeignKey(b => b.UserId);
    }
}
