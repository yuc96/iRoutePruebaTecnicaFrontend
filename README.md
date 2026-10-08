# iRoutePruebaTecnicaFrontend

Frontend Angular 18 de la prueba técnica iRoute: carga CSV de comercios, procesa por fecha y lista válidos / cuarentena.

Hace falta la API en `http://localhost:5080`. El proxy manda `/api` a ese puerto.

```bash
npm install
npm start
```

Abre `http://localhost:4200`. Usuario de prueba: `admin1@correo.com` / `Admin890@`.

1. **Carga CSV**: vista previa y subida.
2. **Comercios Válidos**: dropdown con las fechas subidas y **Procesar Fecha**.
3. **Cuarentena**: mismo filtro de fecha, búsqueda y descarga CSV con `motivo`.
