import fs from "fs";
import path from "path";
import { config } from "../config/config";

// Función para asegurar que el directorio existe
export function ensureDirectoryExists(directoryPath: string) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

// Función para escribir JSON en un archivo
export function writeJSONToFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Función para leer JSON de un archivo
export function readJSONFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Función para limpiar archivos antiguos
export function cleanUpOldFiles(networkName: string) {
  const networkDir = path.join(__dirname, config.paths.configs, networkName);
  if (fs.existsSync(networkDir)) {
    fs.rmdirSync(networkDir, { recursive: true });
  }
  return `${networkName} cleaned up successfully.`;
}
