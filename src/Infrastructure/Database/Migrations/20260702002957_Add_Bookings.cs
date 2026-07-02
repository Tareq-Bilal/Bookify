using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations;

/// <inheritdoc />
public partial class Add_Bookings : Migration
{
    private static readonly string[] BookingRangeIndexColumns = ["resource_id", "start_date_time", "end_date_time"];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");

        migrationBuilder.CreateTable(
            name: "bookings",
            schema: "public",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                resource_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_bookings", x => x.id);
                table.ForeignKey(
                    name: "fk_bookings_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "public",
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_bookings_resource_id_start_date_time_end_date_time",
            schema: "public",
            table: "bookings",
            columns: BookingRangeIndexColumns);

        migrationBuilder.CreateIndex(
            name: "ix_bookings_user_id",
            schema: "public",
            table: "bookings",
            column: "user_id");

        migrationBuilder.Sql(
            """
            ALTER TABLE public.bookings
            ADD CONSTRAINT ex_bookings_resource_time_range
            EXCLUDE USING gist (
                resource_id WITH =,
                tstzrange(start_date_time, end_date_time, '[)') WITH &&
            )
            WHERE (status = 'Confirmed');
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "bookings",
            schema: "public");
    }
}
