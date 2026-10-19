# ============================================================
#  Stage 1 – Restore & Build
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Copy project files first (layer caching for restore)
COPY src/RetailHub.Domain/RetailHub.Domain.csproj           src/RetailHub.Domain/
COPY src/RetailHub.Application/RetailHub.Application.csproj src/RetailHub.Application/
COPY src/RetailHub.Infrastructure/RetailHub.Infrastructure.csproj src/RetailHub.Infrastructure/
COPY src/RetailHub.API/RetailHub.API.csproj                 src/RetailHub.API/

RUN dotnet restore src/RetailHub.API/RetailHub.API.csproj

# Copy all source code
COPY src/ src/

# Publish the API
RUN dotnet publish src/RetailHub.API/RetailHub.API.csproj \
    -c Release \
    -o /app/publish \
    --no-self-contained

# ============================================================
#  Stage 2 – Runtime
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish ./

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "RetailHub.API.dll"]
