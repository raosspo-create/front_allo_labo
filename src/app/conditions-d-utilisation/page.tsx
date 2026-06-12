import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';
import { PRIVACY_POLICY_PATH } from '@/lib/legal';

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Allo-Labo",
  description:
    "Conditions générales d'utilisation de la plateforme Allo-Labo.",
};

const UPDATED_AT = '12 juin 2026';

export default function ConditionsDUtilisationPage() {
  return (
    <LegalDocumentLayout title="Conditions d’utilisation" updatedAt={UPDATED_AT}>
      <p>
        Les présentes conditions d’utilisation (ci-après les « Conditions ») régissent l’accès et
        l’utilisation de la plateforme <strong>Allo-Labo</strong> (site web, espace connecté et
        services associés). En créant un compte ou en utilisant le service, vous acceptez ces
        Conditions dans leur intégralité.
      </p>

      <h2>1. Objet du service</h2>
      <p>
        Allo-Labo met à disposition une plateforme permettant notamment de consulter le catalogue
        de prestations, de formuler des demandes de consultation ou de prélèvement, et de suivre
        l’avancement des commandes. Le service complète, sans se substituer, l’activité du
        laboratoire et le parcours de soins dispensé par les professionnels de santé.
      </p>

      <h2>2. Éligibilité et compte utilisateur</h2>
      <ul>
        <li>
          L’inscription est réservée aux personnes majeures (18 ans révolus) disposant de la
          capacité juridique de contracter.
        </li>
        <li>
          Vous vous engagez à fournir des informations exactes, complètes et à jour lors de la
          création de votre compte.
        </li>
        <li>
          Vous êtes responsable de la confidentialité de vos identifiants et de toute activité
          réalisée depuis votre compte.
        </li>
        <li>
          En cas d’usage frauduleux ou non autorisé, vous devez en informer le laboratoire sans
          délai.
        </li>
      </ul>

      <h2>3. Utilisation autorisée</h2>
      <p>Vous vous engagez à utiliser la plateforme de manière loyale et conforme à sa finalité.</p>
      <p>Il est notamment interdit de :</p>
      <ul>
        <li>tenter d’accéder à des données ou espaces non autorisés ;</li>
        <li>perturber le fonctionnement technique du service ;</li>
        <li>usurper l’identité d’un tiers ou créer de faux comptes ;</li>
        <li>utiliser le service à des fins illicites ou contraires à l’ordre public.</li>
      </ul>

      <h2>4. Demandes et rendez-vous</h2>
      <p>
        Une demande formulée en ligne constitue une sollicitation adressée au laboratoire. Sa
        confirmation, le choix des créneaux et la réalisation effective des prestations dépendent
        de la disponibilité des équipes, des zones couvertes et des règles métier applicables.
      </p>
      <p>
        Les tarifs affichés sont indicatifs lorsqu’ils le sont ; le montant définitif peut varier
        selon la zone, les options choisies ou les analyses prescrites.
      </p>

      <h2>5. Données de santé</h2>
      <p>
        Certaines informations transmises via la plateforme peuvent revêtir un caractère médical.
        Vous vous engagez à ne communiquer que des informations pertinentes et exactes. Le
        traitement de ces données est décrit dans notre{' '}
        <Link href={PRIVACY_POLICY_PATH}>politique de confidentialité</Link>.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments de la plateforme (textes, visuels, logiciels, marques, structure)
        est protégé par le droit de la propriété intellectuelle. Toute reproduction ou
        exploitation non autorisée est interdite.
      </p>

      <h2>7. Disponibilité du service</h2>
      <p>
        Nous nous efforçons d’assurer une disponibilité continue du service, sans garantie
        d’accès ininterrompu. Des opérations de maintenance, mises à jour ou cas de force majeure
        peuvent entraîner une suspension temporaire.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        Allo-Labo ne saurait être tenu responsable des dommages indirects liés à l’utilisation de
        la plateforme, ni des conséquences d’une mauvaise utilisation du service ou d’informations
        inexactes fournies par l’utilisateur.
      </p>
      <p>
        Les décisions médicales et la réalisation des actes de biologie relèvent de la
        responsabilité des professionnels de santé et du laboratoire dans le cadre légal applicable.
      </p>

      <h2>9. Suspension et résiliation</h2>
      <p>
        Nous nous réservons le droit de suspendre ou supprimer un compte en cas de violation des
        présentes Conditions, de comportement abusif ou sur demande des autorités compétentes.
        Vous pouvez demander la clôture de votre compte en contactant le laboratoire.
      </p>

      <h2>10. Modifications des Conditions</h2>
      <p>
        Les Conditions peuvent être modifiées à tout moment. La version en vigueur est celle
        publiée sur le site à la date de votre utilisation. En cas de modification substantielle,
        une information pourra vous être communiquée lors de votre prochaine connexion.
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes Conditions sont régies par le droit applicable en République du Bénin. En cas
        de litige, et après tentative de résolution amiable, les tribunaux compétents du ressort du
        laboratoire pourront être saisis.
      </p>

      <p>
        Pour toute question, contactez Allo-Labo via les coordonnées communiquées sur le site.
      </p>
    </LegalDocumentLayout>
  );
}
