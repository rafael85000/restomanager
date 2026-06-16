'use client';
import { supabase } from '../../lib/supabase';

export default function TestAuth() {
  async function test() {
    console.log('Début test...');
    try {
      const result = await supabase.auth.signInWithPassword({
        email: 'METS_TON_EMAIL_TEST_ICI',
        password: 'METS_TON_MOT_DE_PASSE_TEST_ICI'
      });
      console.log('Résultat complet:', result);
    } catch (e) {
      console.log('Exception attrapée:', e);
    }
    console.log('Fin test.');
  }

  return (
    <div style={{ padding: '40px' }}>
      <button onClick={test} style={{ padding: '12px 24px', fontSize: '16px' }}>
        Tester la connexion Supabase
      </button>
    </div>
  );
}
