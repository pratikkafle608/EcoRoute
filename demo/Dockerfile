# ---- Build stage ----
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src ./src
RUN ./mvnw -B -DskipTests package && \
    mv target/*.jar target/app.jar

# ---- Run stage ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar

# Render assigns the port to listen on via $PORT; application.properties reads it.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
