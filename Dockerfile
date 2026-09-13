FROM maven:3.9-eclipse-temurin-21

WORKDIR /app

COPY execution-engine/pom.xml execution-engine/pom.xml
COPY execution-engine/src execution-engine/src

COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

WORKDIR /app/execution-engine

RUN mvn clean install -DskipTests

WORKDIR /app/backend

RUN mvn clean package -DskipTests

EXPOSE 10000

CMD ["sh", "-c", "java -jar target/backend-0.0.1-SNAPSHOT.jar --server.port=${PORT:-10000}"]