import { drizzle } from 'drizzle-orm/mysql2';
import { metaAdsCredentials } from './drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

console.log('🔍 Verificando credenciales de Meta Ads en BD...\n');

async function checkCredentials() {
  try {
    const creds = await db.select().from(metaAdsCredentials);
    
    if (creds.length === 0) {
      console.log('❌ NO HAY CREDENCIALES GUARDADAS EN LA BASE DE DATOS');
      console.log('El usuario necesita configurar las credenciales en /settings\n');
    } else {
      console.log(`✅ Encontradas ${creds.length} credenciales en BD:\n`);
      creds.forEach((cred, index) => {
        console.log(`Credencial #${index + 1}:`);
        console.log(`  - User ID: ${cred.userId}`);
        console.log(`  - App ID: ${cred.appId || 'NO CONFIGURADO'}`);
        console.log(`  - Ad Account ID: ${cred.adAccountId || 'NO CONFIGURADO'}`);
        console.log(`  - Access Token: ${cred.accessToken ? '✅ CONFIGURADO (oculto por seguridad)' : '❌ NO CONFIGURADO'}`);
        console.log(`  - App Secret: ${cred.appSecret ? '✅ CONFIGURADO (oculto por seguridad)' : '❌ NO CONFIGURADO'}`);
        console.log(`  - Creado: ${cred.createdAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error al verificar credenciales:', error);
    process.exit(1);
  }
}

checkCredentials();
