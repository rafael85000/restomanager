export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#2c2c2a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Politique de confidentialité</h1>
      <p style={{ color: '#888780', marginBottom: 40 }}>Dernière mise à jour : 24 août 2026</p>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Présentation</h2>
        <p>FIMC HACCP est une application mobile de gestion HACCP destinée aux professionnels de la restauration. Elle est développée et exploitée par <strong>FIMC</strong>.</p>
        <p>Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données personnelles lors de l'utilisation de l'application FIMC HACCP et du site web associé.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. Données collectées</h2>
        <p>Dans le cadre de l'utilisation de FIMC HACCP, nous collectons les données suivantes :</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 8 }}><strong>Données de compte</strong> : adresse email, nom, établissement</li>
          <li style={{ marginBottom: 8 }}><strong>Données HACCP</strong> : relevés de températures, lots de traçabilité, étiquettes, fiches de nettoyage, cuissons, réceptions</li>
          <li style={{ marginBottom: 8 }}><strong>Photos</strong> : photos de traçabilité prises ou importées depuis votre appareil, stockées dans notre infrastructure sécurisée</li>
          <li style={{ marginBottom: 8 }}><strong>Données de l'équipe</strong> : noms et codes PIN des membres de votre équipe</li>
          <li style={{ marginBottom: 8 }}><strong>Données Bluetooth</strong> : identifiant de l'imprimante d'étiquettes connectée (aucune donnée transmise à des tiers)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Utilisation des données</h2>
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 8 }}>Assurer le fonctionnement de l'application HACCP</li>
          <li style={{ marginBottom: 8 }}>Stocker et afficher vos enregistrements HACCP (températures, lots, nettoyage...)</li>
          <li style={{ marginBottom: 8 }}>Générer et imprimer vos étiquettes DLC</li>
          <li style={{ marginBottom: 8 }}>Permettre à votre équipe de se connecter via code PIN</li>
          <li style={{ marginBottom: 8 }}>Vous envoyer des alertes en cas de non-conformité</li>
        </ul>
        <p style={{ marginTop: 12 }}><strong>Nous ne vendons jamais vos données à des tiers.</strong></p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Stockage et sécurité</h2>
        <p>Vos données sont stockées sur l'infrastructure <strong>Supabase</strong> (hébergement Europe — Union Européenne), conforme au RGPD. Les communications sont chiffrées via HTTPS/TLS. Les photos sont stockées dans un bucket sécurisé avec accès restreint à votre établissement.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Permissions de l'application</h2>
        <p>L'application FIMC HACCP demande les permissions suivantes sur votre appareil :</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 8 }}><strong>Bluetooth</strong> : pour se connecter à votre imprimante d'étiquettes Bluetooth</li>
          <li style={{ marginBottom: 8 }}><strong>Appareil photo</strong> : pour prendre des photos de traçabilité</li>
          <li style={{ marginBottom: 8 }}><strong>Galerie photos</strong> : pour importer des photos depuis votre photothèque</li>
        </ul>
        <p style={{ marginTop: 8 }}>Ces permissions sont utilisées uniquement pour les fonctionnalités décrites. Aucune donnée n'est transmise à des tiers via ces permissions.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Durée de conservation</h2>
        <p>Vos données HACCP sont conservées pendant toute la durée de votre abonnement et 1 an après résiliation, conformément aux obligations légales en matière de traçabilité alimentaire.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Vos droits (RGPD)</h2>
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 8 }}>Droit d'accès à vos données</li>
          <li style={{ marginBottom: 8 }}>Droit de rectification</li>
          <li style={{ marginBottom: 8 }}>Droit à l'effacement (droit à l'oubli)</li>
          <li style={{ marginBottom: 8 }}>Droit à la portabilité</li>
          <li style={{ marginBottom: 8 }}>Droit d'opposition au traitement</li>
        </ul>
        <p style={{ marginTop: 8 }}>Pour exercer ces droits, contactez-nous à l'adresse : <strong>contact@fimc.fr</strong></p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>8. Cookies</h2>
        <p>Le site web utilise des cookies de session nécessaires au fonctionnement de l'authentification. Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>9. Contact</h2>
        <p>Pour toute question relative à cette politique de confidentialité :</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 8 }}>Email : <strong>contact@fimc.fr</strong></li>
          <li style={{ marginBottom: 8 }}>Site web : <strong>https://restomanager-seven.vercel.app</strong></li>
        </ul>
      </section>

      <hr style={{ borderColor: '#e2e0d8', marginBottom: 24 }} />
      <p style={{ color: '#888780', fontSize: 13 }}>© 2026 FIMC — Tous droits réservés</p>
    </div>
  )
}