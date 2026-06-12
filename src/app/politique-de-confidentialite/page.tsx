import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';
import { TERMS_OF_USE_PATH } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Allo-Labo',
  description:
    'Comment Allo-Labo collecte, utilise et protège vos données personnelles.',
};

const UPDATED_AT = '12 juin 2026';

export default function PolitiqueDeConfidentialitePage() {
  return (
    <LegalDocumentLayout title="Politique de confidentialité" updatedAt={UPDATED_AT}>
      <p>
        La présente politique de confidentialité décrit la manière dont <strong>Allo-Labo</strong>{' '}
        (ci-après « nous », « le laboratoire ») traite les données personnelles des utilisateurs de
        la plateforme en ligne accessible notamment sur <strong>allolabo.bj</strong>.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est Allo-Labo, laboratoire d’analyses médicales et de services
        de prélèvement à domicile. Pour toute question relative à vos données, vous pouvez nous
        contacter via les coordonnées indiquées sur le site ou auprès de votre interlocuteur
        habituel au laboratoire.
      </p>

      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l’utilisation du service, nous pouvons collecter notamment :</p>
      <ul>
        <li>
          <strong>Données d’identification</strong> : nom, prénom, date de naissance, adresse
          e-mail, numéro de téléphone ;
        </li>
        <li>
          <strong>Données de compte</strong> : identifiants de connexion, historique d’accès ;
        </li>
        <li>
          <strong>Données liées aux demandes</strong> : prestations choisies, zone géographique,
          créneaux, statut des commandes et rendez-vous ;
        </li>
        <li>
          <strong>Données de santé</strong> lorsque nécessaire à la réalisation des prestations
          (informations médicales transmises dans le cadre du parcours de soins) ;
        </li>
        <li>
          <strong>Données techniques</strong> : journaux de connexion, adresse IP, type de
          navigateur, à des fins de sécurité et de bon fonctionnement du service.
        </li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont traitées pour :</p>
      <ul>
        <li>créer et gérer votre compte utilisateur ;</li>
        <li>traiter vos demandes de consultation, prélèvement ou analyse ;</li>
        <li>assurer le suivi de vos commandes et la communication avec les équipes du laboratoire ;</li>
        <li>respecter nos obligations légales et réglementaires ;</li>
        <li>améliorer la qualité et la sécurité de la plateforme.</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Le traitement repose notamment sur l’exécution du contrat lié à l’utilisation du service,
        votre consentement lorsque requis (notamment à la création de compte), et le respect
        d’obligations légales applicables au secteur de la santé.
      </p>

      <h2>5. Destinataires des données</h2>
      <p>
        Vos données peuvent être communiquées aux personnels habilités d’Allo-Labo, aux prestataires
        techniques intervenant pour l’hébergement ou la maintenance de la plateforme (dans la limite
        de leur mission), ainsi qu’aux autorités compétentes lorsque la loi l’exige.
      </p>
      <p>
        Nous ne vendons pas vos données personnelles à des tiers.
      </p>

      <h2>6. Durée de conservation</h2>
      <p>
        Les données sont conservées pendant la durée nécessaire à la gestion de la relation
        client et au respect des délais légaux applicables aux dossiers médicaux et comptables.
        Les données de compte inactif peuvent être supprimées ou anonymisées conformément à notre
        politique interne de conservation.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
        protéger vos données contre l’accès non autorisé, la perte, la divulgation ou
        l’altération. L’accès aux espaces connectés est protégé par authentification.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Conformément à la réglementation applicable, vous disposez notamment d’un droit d’accès,
        de rectification, d’effacement, de limitation du traitement et d’opposition, dans les
        limites prévues par la loi, notamment pour les données de santé.
      </p>
      <p>
        Pour exercer vos droits, contactez le laboratoire en précisant votre identité et la
        nature de votre demande. Une réponse vous sera apportée dans les délais prévus par la loi.
      </p>

      <h2>9. Cookies et traceurs</h2>
      <p>
        La plateforme peut utiliser des cookies ou mécanismes de stockage local strictement
        nécessaires au fonctionnement du service (par exemple maintien de session). Aucun cookie
        publicitaire tiers n’est déployé sans votre information préalable.
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut être mise à jour pour refléter l’évolution du service ou du cadre
        légal. La date de dernière mise à jour figure en tête de page. Nous vous invitons à la
        consulter régulièrement.
      </p>

      <p>
        Pour les règles d’utilisation du service, consultez également nos{' '}
        <Link href={TERMS_OF_USE_PATH}>conditions d’utilisation</Link>.
      </p>
    </LegalDocumentLayout>
  );
}
