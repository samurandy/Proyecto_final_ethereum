import path from "path";

const rootPath = path.resolve(__dirname, "../../");

export const config = {
  server: {
    port: process.env.PORT || 3000, // Puerto del servidor
  },
  paths: {
    configs: path.join(rootPath, "configs"), // Carpeta de configuraciones
    dockerFiles: path.join(rootPath, "configs/dockerfiles"),
    passwords: path.join(rootPath, "configs/passwords"),
    data: path.join(rootPath, "data"),
    configDir: path.join(__dirname, "../configs"), // Directorio para archivos de configuración
  },
  logging: {
    level: process.env.LOG_LEVEL || "info", // Nivel de logs
  },
  genesis: {
    blockTime: 15, // Tiempo por defecto en segundos entre bloques
  },
};
