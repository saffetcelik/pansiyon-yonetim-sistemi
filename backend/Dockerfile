FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["PansiyonYonetimSistemi.API.csproj", "./"]
RUN dotnet restore "PansiyonYonetimSistemi.API.csproj"

# Copy the rest of the backend files and build
COPY . .
RUN dotnet build "PansiyonYonetimSistemi.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PansiyonYonetimSistemi.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install postgresql-client for native pg_dump and psql backup/restore utilities
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 8080

ENTRYPOINT ["dotnet", "PansiyonYonetimSistemi.API.dll"]
