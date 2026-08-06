FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["PansiyonYonetimSistemi.API.csproj", "./"]
RUN dotnet restore "PansiyonYonetimSistemi.API.csproj"

# Copy the rest of the backend files and build
COPY . .
RUN dotnet build "PansiyonYonetimSistemi.API.csproj" -c Release -o /app/build

# Install dotnet-ef tool and build migration bundle executable
RUN dotnet tool install --global dotnet-ef --version 8.0.*
ENV PATH="$PATH:/root/.dotnet/tools"
RUN dotnet ef migrations bundle --output /app/publish/bundle --configuration Release --force

# Publish stage
FROM build AS publish
RUN dotnet publish "PansiyonYonetimSistemi.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 8080

# Run migration bundle on container startup before running the app
ENTRYPOINT ["sh", "-c", "./bundle || true && dotnet PansiyonYonetimSistemi.API.dll"]

