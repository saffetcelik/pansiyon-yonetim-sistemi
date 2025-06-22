using AutoMapper;
using PansiyonYonetimSistemi.API.Models;
using PansiyonYonetimSistemi.API.DTOs;

namespace PansiyonYonetimSistemi.API.Data
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Customer Mappings
            CreateMap<Customer, CustomerDto>();
            CreateMap<CreateCustomerDto, Customer>();
            CreateMap<UpdateCustomerDto, Customer>();

            // Room Mappings
            CreateMap<Room, RoomDto>();
            CreateMap<CreateRoomDto, Room>();
            CreateMap<UpdateRoomDto, Room>();

            // Reservation Mappings
            CreateMap<Reservation, ReservationDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => $"{src.Customer.FirstName} {src.Customer.LastName}"))
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.Room.RoomNumber));
            
            CreateMap<CreateReservationDto, Reservation>();
            CreateMap<UpdateReservationDto, Reservation>();

            // Product Mappings
            CreateMap<Product, ProductDto>();
            CreateMap<CreateProductDto, Product>();
            CreateMap<UpdateProductDto, Product>();

            // Sale Mappings
            CreateMap<Sale, SaleDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src =>
                    src.Customer != null ? $"{src.Customer.FirstName} {src.Customer.LastName}" : null))
                .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod.ToString()));

            CreateMap<CreateSaleDto, Sale>();

            // SaleItem Mappings
            CreateMap<SaleItem, SaleItemDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name));

            CreateMap<CreateSaleItemDto, SaleItem>();

            // Payment Mappings
            CreateMap<Payment, PaymentDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src =>
                    src.Customer != null ? $"{src.Customer.FirstName} {src.Customer.LastName}" : null))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src =>
                    src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : null));

            CreateMap<CreatePaymentDto, Payment>();
            CreateMap<UpdatePaymentDto, Payment>();

            // Expense Mappings
            CreateMap<Expense, ExpenseDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src =>
                    src.User != null ? $"{src.User.FirstName} {src.User.LastName}" : null))
                .ForMember(dest => dest.ApprovedByUserName, opt => opt.MapFrom(src =>
                    src.ApprovedByUser != null ? $"{src.ApprovedByUser.FirstName} {src.ApprovedByUser.LastName}" : null));

            CreateMap<CreateExpenseDto, Expense>();
            CreateMap<UpdateExpenseDto, Expense>();

            // User Mappings
            CreateMap<User, UserDto>();
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>();
        }
    }
}
