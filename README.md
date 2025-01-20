# Ethereum PoS Clique Network Automation

Este proyecto es una aplicación backend desarrollada con Node.js y Express que permite la automatización de redes privadas de Ethereum PoS Clique. La aplicación utiliza TypeScript, sigue el patrón MVC y se ejecuta en contenedores Docker. Próximamente se añadirá un frontend desarrollado con React.

## Requisitos

- Docker
- Node.js (v14 o superior)
- npm o yarn

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/samurandy/proyecto_final_ethereum.git
   cd tu-repositorio

   ```

2. Instala las dependencias:

   ```bash
   npm install

   ```

3. Construye y ejecuta los contenedores Docker:
   ```bash
   docker-compose up --build
   ```

## Uso

La aplicación expone los siguientes endpoints para la gestión de redes y nodos:

#### Gestión de Redes

- Obtener todas las redes:

  ```bash
  curl -X GET http://localhost:3000/networks/

  ```

- Crear una red:

  ```bash
  curl -X POST http://localhost:3000/networks/create -H "Content-Type: application/json" -d '{
  "networkName": "testNetwork",
  "chainId": 13579,
  "blockTime": 2
  }'

  ```

- Iniciar una red parada:

  ```bash
  curl -X POST http://localhost:3000/networks/start -H "Content-Type: application/json" -d '{
  "networkName": "testNetwork"
  }'

  ```

- Detener una red iniciada:

  ```bash
  curl -X POST http://localhost:3000/networks/stop -H "Content-Type: application/json" -d '{
  "networkName": "yourNetworkName"
  }'

  ```

- Eliminar una red:

  ```bash
  curl -X POST http://localhost:3000/networks/remove -H "Content-Type: application/json" -d '{
  "networkName": "yourNetworkName"
  }'

  ```

- Obtener el estado de una red:
  ```bash
  curl -X GET http://localhost:3000/networks/yourNetworkName/status
  ```

#### Gestión de Nodos

- Agregar un nodo signer:

  ```bash
  curl -X POST http://localhost:3000/networks/testNetwork/nodes/add -H "Content-Type: application/json" -d '{
  "nodeName": "signerNode",
  "password": "1234",
  "nodeType": "signer",
  "initialBalance": "100000000000000000000000000"
  }'

  ```

- Añadir un nodo RPC:

  ```bash
  curl -X POST http://localhost:3000/networks/testNetwork/nodes/add -H "Content-Type: application/json" -d '{
  "nodeName": "rpcNode",
  "password": "1234",
  "nodeType": "rpc",
  "initialBalance": "100000000000000000000000000"
  }'

  ```

- Añadir un nodo member:

  ```bash
  curl -X POST http://localhost:3000/networks/testNetwork/nodes/add -H "Content-Type: application/json" -d '{
  "nodeName": "memberNode",
  "password": "1234",
  "nodeType": "member",
  "initialBalance": "100000000000000000000000000"
  }'

  ```

- Añadir un nodo bootstrap:

  ```bash
  curl -X POST http://localhost:3000/networks/yourNetworkName/nodes/add -H "Content-Type: application/json" -d '{
  "nodeName": "bootstrapNode",
  "password": "yourPassword",
  "nodeType": "bootstrap",
  "initialBalance": "100000000000000000000000000"
  }'

  ```

- Iniciar un nodo:

  ```bash
  curl -X POST http://localhost:3000/networks/yourNetworkName/nodes/start -H "Content-Type: application/json" -d '{
  "nodeName": "yourNodeName"
  }'

  ```

- Detener un nodo:

  ```bash
  curl -X POST http://localhost:3000/networks/yourNetworkName/nodes/stop -H "Content-Type: application/json" -d '{
  "nodeName": "yourNodeName"
  }'

  ```

- Eliminar un nodo:
  ```bash
  curl -X POST http://localhost:3000/networks/yourNetworkName/nodes/remove -H "Content-Type: application/json" -d '{
  "nodeName": "rpcNode"
  }'
  ```

## Tecnologías Utilizadas

**TypeScript:** Lenguaje de programación.

**Node.js:** Entorno de ejecución de JavaScript.

**Express:** Framework para aplicaciones web.

**MVC:** Patrón de diseño Modelo-Vista-Controlador.

**Docker:** Plataforma de contenedores.

**Geth:** Cliente de Ethereum (imagen ethereum/client-go:alltools-v1.11.5).

## Contribución

Si deseas contribuir a este proyecto, por favor sigue los siguientes pasos:

- Haz un fork del repositorio.

- Crea una nueva rama (git checkout -b feature/nueva-funcionalidad).

- Realiza tus cambios y haz commit (git commit -am 'Añade nueva funcionalidad').

- Haz push a la rama (git push origin feature/nueva-funcionalidad).

- Abre un Pull Request.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

Copy

### Explicación

- **.gitignore**: Este archivo excluye directorios y archivos que no deben ser rastreados por Git, como dependencias de Node.js, archivos de entorno, configuraciones de IDE, y logs.
- **README.md**: Este archivo proporciona una descripción general del proyecto, instrucciones de instalación, uso de los endpoints, tecnologías utilizadas, y cómo contribuir al proyecto. También incluye una sección de licencia.

Estos archivos deberían ayudarte a mantener tu proyecto organizado y proporcionar una buena documentación para cualquier persona que desee utilizarlo o contribuir a él.
