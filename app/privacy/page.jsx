export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#2c2c2a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Politique de confidentialité</h1>
      <p style={{ color: '#888780', marginBottom: 40 }}>Dernière mise à jour : 24 août 2026</p>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Présentation</h2>
        <p>FIMC HACCP est une application mobile de gestion HACCP destinée aux professionnels de la restauration, développée par FIMC.</p>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. Données collectées</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}>Données de compte : email, nom, établissement</li>
          <li style={{ marginBottom: 8 }}>Données HACCP : températures, lots, étiquettes, nettoyage, cuissons, réceptions</li>
          <li style={{ marginBottom: 8 }}>Photos de traçabilité</li>
          <li style={{ marginBottom: 8 }}>Noms et codes PIN des membres de l'équipe</li>
          <li style={{ marginBottom: 8 }}>Identifiant Bluetooth de l'imprimante connectée</li>
        </ul>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Utilisation des données</h2>
        <p>Vos données sont utilisées uniquement pour le fonctionnement de l'application. Nous ne vendons jamais vos données à des tiers.</p>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Stockage et sécurité</h2>
        <p>Données stockées sur Supabase (hébergement Europe, conforme RGPD). Communications chiffrées via HTTPS/TLS.</p>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Permissions de l'application</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li style={{ marginBottom: 8 }}>Bluetooth : connexion à l'imprimante d'étiquettes</li>
          <li style={{ marginBottom: 8 }}>Appareil photo : photos de traçabilité</li>
          <li style={{ marginBottom: 8 }}>Galerie photos : import de photos</li>
        </ul>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Vos droits (RGPD)</h2>
        <p>Vous disposez des droits d'accès, rectification, effacement et portabilité de vos données. Contact : rafaelcolonnello85@gmail.com</p>
      </section>
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Contact</h2>
        <p>Email : rafaelcolonnello85@gmail.com</p>
        <p>Site : https://restomanager-seven.vercel.app</p>
      </section>
      <hr style={{ borderColor: '#e2e0d8', marginBottom: 24 }} />
      <p style={{ color: '#888780', fontSize: 13 }}>© 2026 FIMC — Tous droits réservés</p>
    </div>
  )
}
