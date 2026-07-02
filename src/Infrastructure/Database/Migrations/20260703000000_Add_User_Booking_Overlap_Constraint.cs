using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations;

/// <inheritdoc />
[Migration("20260703000000_Add_User_Booking_Overlap_Constraint")]
public partial class AddUserBookingOverlapConstraint : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE public.bookings
            ADD CONSTRAINT ex_bookings_user_time_range
            EXCLUDE USING gist (
                user_id WITH =,
                tstzrange(start_date_time, end_date_time, '[)') WITH &&
            )
            WHERE (status = 'Confirmed');
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE public.bookings
            DROP CONSTRAINT ex_bookings_user_time_range;
            """);
    }
}
