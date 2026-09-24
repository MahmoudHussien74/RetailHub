using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Products.DTOs;

namespace RetailHub.Application.Features.Products.Queries.GetProductByBarcode;

public record GetProductByBarcodeQuery(string Barcode) : IRequest<Result<ProductDetailDto>>;
