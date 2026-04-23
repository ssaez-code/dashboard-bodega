# Dashboard Bodega Las Parcelas

Dashboard en tiempo real que lee datos desde Google Sheets.

## Setup en Vercel (5 minutos)

### Paso 1: Crear cuenta en GitHub
Si no tienes una, ve a github.com y crea una cuenta gratis.

### Paso 2: Subir este proyecto a GitHub
1. Ve a github.com → botón "+" arriba a la derecha → "New repository"
2. Nombre: `dashboard-bodega` (o el que quieras)
3. Déjalo público
4. Click "Create repository"
5. Sube los archivos de esta carpeta:
   - Click "uploading an existing file"
   - Arrastra la carpeta completa
   - Click "Commit changes"

### Paso 3: Deploy en Vercel
1. Ve a vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Autoriza Vercel para acceder a tu GitHub
4. Click "Add New Project"
5. Busca tu repo "dashboard-bodega" → click "Import"
6. NO cambies nada → click "Deploy"
7. Espera ~1 minuto → te da tu URL pública 🎉

### Paso 4: Verificar
- Tu dashboard está en algo como: `dashboard-bodega.vercel.app`
- Comparte ese link con quien quieras
- Los datos se actualizan cada vez que alguien abre el link

## Requisitos
- Tu Google Sheet debe estar compartido como "Cualquier persona con el enlace → Lector"
- Sheet ID configurado: 1MFnNFVo9qH5Bh_Crz8SIZ4Xs8DkxKi2Tix4_E0EzRNc

## Cambiar el Sheet
Si cambias de Sheet, edita la línea 4 de `pages/index.jsx`:
```
const SHEET_ID = "TU_NUEVO_ID_AQUI";
```
