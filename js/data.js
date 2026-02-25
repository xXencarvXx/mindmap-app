// ──────────────────────────────────────────────
// DATA - Edit this section to update the mind map
// ──────────────────────────────────────────────

export const ROOT_LABEL = "Mes Priorités";

export const PROJECTS = [
{
    id: "attribution",
    title: "Marketing Attribution",
    color: "#3b82f6",
    status: "in_progress",
    description: "Fiabiliser le tracking marketing et l'attribution des leads. Objectif : 85% de leads avec source+medium, -40% blank origins.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "gtm-tags",
        title: "GTM Custom Tags",
        status: "in_progress",
        description: "Tags JavaScript custom dans GTM pour récupérer les UTMs et Ads IDs, et tracer les sources d'acquisition. Prérequis : configuration cookie banner (consentement requis pour les tags Ads).",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── Configuration ──", done: false },
          { text: "Cookie banner : consentement Ads IDs", done: true },
          { text: "── Tags UTM ──", done: false },
          { text: "cHTML - UTM link decoration (always)", done: false },
          { text: "cHTML - UTM storage + URL restore + first referrer", done: false },
          { text: "cHTML - No UTM Traffic Fallback", done: false },
          { text: "── Tags Ads ──", done: false },
          { text: "cHTML - Ads identifiers storage + URL restore", done: false }
        ],
        links: []
      },
      {
        id: "gf-hidden-fields",
        title: "GF Hidden Fields",
        status: "in_progress",
        description: "Ajouter les hidden fields aux formulaires Gravity Forms pour capturer UTMs et Ads IDs. Ces champs sont la base de toute la chaîne d'attribution : Campaign Tracker les remplit, les confirmations les transmettent.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── UTMs (basiques) ──", done: false },
          { text: "utm_source", done: true },
          { text: "utm_medium", done: true },
          { text: "utm_campaign", done: true },
          { text: "utm_term", done: true },
          { text: "utm_content", done: true },
          { text: "── Ads IDs ──", done: false },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads cross-device)", done: false },
          { text: "wbraid (Google Ads web-to-app)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false }
        ],
        links: []
      },
      {
        id: "campaign-tracker",
        title: "Campaign Tracker Plugin",
        status: "in_progress",
        description: "Plugin Gravity Forms qui mappe les query params aux hidden fields des formulaires. L'agence a supprimé le plugin lors de la migration du site, cassant tout le mapping existant. Réinstallé de zéro.",
        prerequisites: "GF Hidden Fields (les champs Ads doivent exister avant de pouvoir les mapper)",
        blockers: "",
        notes: "",
        checklist: [
          { text: "Réinstaller le plugin", done: true },
          { text: "Mapper les 5 UTMs aux hidden fields", done: true },
          { text: "Mapper les 6 Ads IDs aux hidden fields", done: false }
        ],
        links: []
      },
      {
        id: "confirmations",
        title: "Gestion Confirmations",
        status: "blocked",
        description: "300+ confirmations Gravity Forms (contact + événements + téléchargements) à nettoyer puis équiper avec les champs UTM cachés (Pass Field Data via Query String).",
        prerequisites: "GF Hidden Fields (Phase 2 : les champs doivent exister avant de configurer Pass Field Data)",
        blockers: "L'import Gravity Forms crée une copie du formulaire (pas de remplacement possible). La fonctionnalité 'formulaire par défaut' ne fonctionne plus après la migration. L'agence veut facturer le changement manuel sur chaque page.",
        notes: "",
        checklist: [
          { text: "── Phase 1 : Tri et nettoyage ──", done: false },
          { text: "Créer Google Sheet d'inventaire", done: true },
          { text: "Partager avec l'équipe pour validation", done: true },
          { text: "Contact : supprimer confirmations inutiles", done: false },
          { text: "Contact : supprimer pages orphelines", done: false },
          { text: "Contact : supprimer Pardot handlers obsolètes", done: false },
          { text: "Événements : supprimer confirmations inutiles", done: false },
          { text: "Événements : supprimer pages orphelines", done: false },
          { text: "Événements : supprimer Pardot handlers obsolètes", done: false },
          { text: "Téléchargements : supprimer confirmations inutiles", done: false },
          { text: "Téléchargements : supprimer pages orphelines", done: false },
          { text: "Téléchargements : supprimer Pardot handlers obsolètes", done: false },
          { text: "── Phase 2 : Ajout champs UTM ──", done: false },
          { text: "Contact : exporter formulaire JSON", done: false },
          { text: "Contact : remplacer champs UTM cachés via agent", done: false },
          { text: "Contact : réimporter formulaire", done: false },
          { text: "Événements : exporter formulaire JSON", done: false },
          { text: "Événements : remplacer champs UTM cachés via agent", done: false },
          { text: "Événements : réimporter formulaire", done: false },
          { text: "Téléchargements : exporter formulaire JSON", done: false },
          { text: "Téléchargements : remplacer champs UTM cachés via agent", done: false },
          { text: "Téléchargements : réimporter formulaire", done: false }
        ],
        links: []
      },
      {
        id: "pardot-fields",
        title: "Pardot Custom Fields",
        status: "in_progress",
        description: "Créer les champs UTM et Ads IDs dans Pardot puis les ajouter à TOUS les form handlers.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "utm_source", done: true },
          { text: "utm_medium", done: true },
          { text: "utm_campaign", done: true },
          { text: "utm_term", done: true },
          { text: "utm_content", done: true },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads iOS)", done: false },
          { text: "wbraid (Google Ads web)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Facebook/Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false },
          { text: "Ajouter les nouveaux champs à tous les form handlers", done: false }
        ],
        links: []
      },
      {
        id: "sf-fields",
        title: "Salesforce Fields",
        status: "blocked",
        description: "Créer les champs custom dans Salesforce et mapper Pardot vers SF pour que l'attribution remonte automatiquement.",
        prerequisites: "Pardot Custom Fields (les champs Ads doivent exister dans Pardot avant le mapping vers SF)",
        blockers: "François et Thomas Kaes doivent valider l'intervention sur Salesforce. Pas de bandwidth disponible de leur côté pour le moment.",
        notes: "",
        checklist: [
          { text: "utm_source (last touch)", done: true },
          { text: "utm_medium (last touch)", done: true },
          { text: "utm_campaign (last touch)", done: true },
          { text: "utm_term (last touch)", done: true },
          { text: "utm_content (last touch)", done: true },
          { text: "utm_source_origin (first touch)", done: true },
          { text: "utm_medium_origin (first touch)", done: true },
          { text: "utm_campaign_origin (first touch)", done: true },
          { text: "utm_term_origin (first touch)", done: true },
          { text: "utm_content_origin (first touch)", done: true },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads cross-device)", done: false },
          { text: "wbraid (Google Ads web-to-app)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false },
          { text: "Champs UTM sur objet Campaign", done: false },
          { text: "Mapper champs Pardot vers SF", done: false }
        ],
        links: []
      }
    ]
  },
  {
    id: "website",
    title: "Website",
    color: "#10b981",
    status: "in_progress",
    description: "Missions site web : qualité technique SEO, présence offsite, et tracking GA4.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "seo",
        title: "SEO Technique",
        status: "in_progress",
            description: "Réduire d'au moins 20% les anomalies techniques SEO par rapport à l'audit initial. Maintenir le taux d'erreurs 404 inférieur à 2% et le taux de redirections internes inférieur à 3%.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "offsite",
        title: "Google My Business / Offsite",
        status: "not_started",
        description: "Corrections techniques offsite, Google My Business.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "ga4",
        title: "GA4 Event Tracking",
        status: "not_started",
            description: "Définir et déployer un socle d'événements GA4 standardisés couvrant les parcours clés (navigation, contenus, conversions). Assurer leur exploitation régulière dans les analyses marketing et produit. Deadline : T2.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "geo",
        title: "GEO / Visibilité IA",
        status: "not_started",
        description: "Optimiser la visibilité d'ayming.fr dans les moteurs de recherche IA (ChatGPT, Perplexity, Claude, Gemini). Audit réalisé : score actuel 35% (7/20 requêtes prospects). GPTBot et CCBot bloqués, llms.txt sans contexte, pas de schema Service/FAQ.",
        blockers: "",
        notes: "",
        checklist: [],
        links: [],
        children: [
          {
            id: "geo-robots",
            title: "robots.txt",
            status: "done",
            description: "Le robots.txt du site est basique (sitemap + disallows standard). Il manque une stratégie de crawl pour les bots IA (GPTBot, CCBot, ClaudeBot, PerplexityBot) et une gestion fine des sections autorisées/interdites.",
            blockers: "",
            notes: "Appliquer via Rank Math > General Settings > Edit robots.txt dans WordPress.",
            checklist: [
              { text: "Récupérer l'accès à Rank Math > Edit robots.txt", done: true },
              { text: "Autoriser GPTBot (ChatGPT) sur le contenu public", done: true },
              { text: "Autoriser CCBot (Common Crawl)", done: true },
              { text: "Ajouter ClaudeBot explicitement", done: true },
              { text: "Ajouter PerplexityBot explicitement", done: true },
              { text: "Ajouter Bytespider (TikTok/Doubao) explicitement", done: true },
              { text: "Garder Disallow sur wp-admin, wp-login, search, author, embed", done: true },
              { text: "Appliquer dans Rank Math > General Settings > Edit robots.txt", done: true },
              { text: "Tester dans ChatGPT/Perplexity si ayming.fr est cité (attendre 2-3 semaines)", done: false }
            ],
            links: [
              { url: "https://ayming-france.github.io/mindmap/drafts/robots-txt-draft.md", text: "Contenu robots.txt appliqué" }
            ]
          },
          {
            id: "geo-llms",
            title: "llms.txt",
            status: "not_started",
            description: "Réécrire llms.txt avec du contexte structuré. Actuellement c'est un dump de 300+ URLs d'articles généré par RankMath. Un LLM qui lit ce fichier ne sait toujours pas ce qu'Ayming fait ni vend.",
            prerequisites: "robots.txt (les bots doivent pouvoir accéder au fichier)",
            blockers: "",
            notes: "",
            checklist: [
              { text: "Ajouter section About (description, date création, employés, pays)", done: false },
              { text: "Ajouter section Services (4 verticales avec liens directs par offre)", done: false },
              { text: "Ajouter proof points par verticale (nb clients, dossiers, € récupérés)", done: false },
              { text: "Ajouter section Contact (formulaire, adresse)", done: false },
              { text: "Garder la liste d'articles RankMath en dessous", done: false },
              { text: "Configurer dans Rank Math > General Settings > LLMs.txt", done: false }
            ],
            links: [
              { url: "https://ayming-france.github.io/mindmap/drafts/llms-txt-draft.md", text: "Draft llms.txt à appliquer" }
            ]
          },
          {
            id: "geo-schema",
            title: "Schema Markup",
            status: "not_started",
            description: "Ajouter du schema JSON-LD structuré pour que les moteurs IA comprennent qu'Ayming vend des services. Actuellement toutes les pages (y compris les offres) sont typées Article. Il manque Service, FAQ, HowTo.",
            blockers: "",
            notes: "",
            checklist: [
              { text: "── Pages d'offres ──", done: false },
              { text: "ProfessionalService sur /innovation/", done: false },
              { text: "ProfessionalService sur /ressources-humaines/", done: false },
              { text: "ProfessionalService sur /finance-taxes/", done: false },
              { text: "ProfessionalService sur /performance-hospitaliere/", done: false },
              { text: "── Articles ──", done: false },
              { text: "FAQPage sur les articles questions/réponses", done: false },
              { text: "HowTo sur les guides pratiques", done: false },
              { text: "── Homepage ──", done: false },
              { text: "Ajouter og:image", done: false },
              { text: "Enrichir Organization schema avec les proof points", done: false }
            ],
            links: []
          },
          {
            id: "geo-content",
            title: "Contenu Direct-Answer",
            status: "not_started",
            description: "Créer du contenu qui répond directement aux questions des prospects. Les moteurs IA citent le contenu éducatif (guides, calculateurs), pas les pages commerciales. Ayming est absent sur les requêtes basiques (comment obtenir le CIR, calcul taux AT/MP, avantage en nature véhicule).",
            blockers: "",
            notes: "",
            checklist: [
              { text: "── AT/MP (score 60%, améliorer) ──", done: false },
              { text: "Guide : calcul du taux AT/MP (requête saisonnière, absent)", done: false },
              { text: "Guide : faute inexcusable employeur (intent juridique, absent)", done: false },
              { text: "── CIR (score 40%, prioritaire) ──", done: false },
              { text: "Guide : comment obtenir le CIR (requête basique n°1, absent)", done: false },
              { text: "Guide : calcul montant CIR (Sogedev et F.initiatives dominent)", done: false },
              { text: "Guide : sous-traitance et dépenses éligibles CIR", done: false },
              { text: "── RH / Social (score 20%, critique) ──", done: false },
              { text: "Simulateur : avantage en nature véhicule 2025 (post-réforme)", done: false },
              { text: "Guide : audit charges sociales (petits cabinets dominent)", done: false },
              { text: "── Financement (score 20%, critique) ──", done: false },
              { text: "Page référence : cabinet conseil subventions (10 concurrents, pas Ayming)", done: false },
              { text: "Guide : comment candidater France 2030", done: false }
            ],
            links: []
          },
          {
            id: "geo-proof",
            title: "Preuves Chiffrées",
            status: "not_started",
            description: "Publier des métriques client visibles et indexables. Leyton cite 4 000 clients, 3 500 dossiers, 99% validation. ABGI cite 2 milliards € générés. Ayming n'a aucun chiffre qui circule en ligne. Les moteurs IA ne peuvent pas différencier Ayming des autres.",
            blockers: "",
            notes: "",
            checklist: [
              { text: "Collecter les métriques internes (nb dossiers CIR, taux succès, € récupérés AT/MP)", done: false },
              { text: "Publier sur les pages d'offres (pas dans un PDF gated)", done: false },
              { text: "Intégrer dans le schema Organization JSON-LD", done: false },
              { text: "Intégrer dans llms.txt section About", done: false },
              { text: "Créer des cas clients chiffrés indexables (pas des témoignages vidéo)", done: false }
            ],
            links: []
          },
          {
            id: "geo-redirects",
            title: "Redirections 301",
            status: "not_started",
            description: "Les anciennes URLs (/nos-offres/, /rh-et-remuneration/, /financement-de-linnovation/) retournent 404. Tous les backlinks et données d'entraînement IA pointant vers ces URLs sont perdus.",
            blockers: "",
            notes: "",
            checklist: [
              { text: "301 : /nos-offres/ vers la nouvelle URL offres", done: false },
              { text: "301 : /rh-et-remuneration/ vers /ressources-humaines/", done: false },
              { text: "301 : /financement-de-linnovation/ vers /innovation/", done: false },
              { text: "Auditer les autres 404 via Google Search Console", done: false },
              { text: "Configurer via Rank Math > Redirections ou .htaccess", done: false }
            ],
            links: []
          }
        ]
      }
    ]
  },
  {
    id: "offres-rh",
    title: "Offres RH",
    color: "#f59e0b",
    status: "in_progress",
    description: "Structurer le positionnement des offres RH à travers des OAV alignés avec la nouvelle stratégie de message et les brand guidelines. T1.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "sinistralite-app",
        title: "App Sinistralité par NAF",
        status: "in_progress",
        description: "Pendant l'étude de marché, les fichiers Excel généraient trop d'allers-retours avec les équipes Sales et BPO qui avaient besoin de voir pour croire. Pour réduire la friction et rendre les conclusions lisibles, un dashboard interactif a été créé (AT, MP, Trajet par code NAF, données Ameli 2023). Peut aussi servir de socle au baromètre de la sinistralité.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── Phase 1 : MCP Ameli (AT + MP + Trajet) ──", done: false },
          { text: "Extraction données Excel AT", done: true },
          { text: "Extraction données Excel MP", done: true },
          { text: "Extraction données Trajet (PDF)", done: true },
          { text: "Outils MCP : at_search_naf, at_get_stats", done: true },
          { text: "Outils MCP : mp_search_naf, mp_get_stats", done: true },
          { text: "Outils MCP : trajet_search_naf, trajet_get_stats", done: true },
          { text: "Dashboard 3 vues avec nav-rail", done: true },
          { text: "── Phase 2 : PDF Fiches Ameli (démographie) ──", done: false },
          { text: "Parser PDF : synthèse + évolution 5 ans", done: true },
          { text: "Parser PDF : sexe et âge (9 groupes)", done: true },
          { text: "Affichage démographie dans vue AT", done: true },
          { text: "Parser PDF : type de contrat (CDI, CDD, intérim)", done: false },
          { text: "Parser PDF : qualification (cadres, employés, ouvriers)", done: false },
          { text: "Parser PDF : lésions, sièges, modalités", done: false },
          { text: "Parser PDF : taille d'établissement (IF par tranche)", done: false },
          { text: "Parser PDF : maladies pro (tableaux, durée exposition)", done: false }
        ],
        links: [
          { url: "https://ayming-france.github.io/tableau-at-naf/", text: "App Sinistralité (GitHub Pages)" }
        ]
      },
      {
        id: "sirene",
        title: "Base SIRENE (INSEE)",
        status: "not_started",
        description: "Accéder aux données entreprises françaises (INSEE SIRENE : 34M établissements) pour visualiser et exporter des segments de marché. Deux options d'accès : API temps réel (api.sirene.fr, gratuite, 30 requêtes/min) ou téléchargement du fichier stock complet (1 Go, mise à jour mensuelle). L'API est plus simple à démarrer, le stock permet des analyses massives sans limite de requêtes.",
        prerequisites: "App Sinistralité par NAF (croisement sinistralité x données entreprises pour le ciblage)",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── Phase 1 : Accès aux données ──", done: false },
          { text: "Choisir la source : API temps réel ou fichier stock complet", done: false },
          { text: "Obtenir les accès (token API ou téléchargement data.gouv.fr)", done: false },
          { text: "Valider qu'on récupère bien : nom, SIRET, NAF, tranche effectif, adresse", done: false },
          { text: "── Phase 2 : Indexation et requêtage ──", done: false },
          { text: "Stocker les données dans une base locale (SQLite) pour requêtes rapides", done: false },
          { text: "Indexer par code NAF, tranche d'effectif et département", done: false },
          { text: "Tester : combien d'entreprises 250+ dans un secteur NAF donné ?", done: false },
          { text: "── Phase 3 : Dashboard segments de marché ──", done: false },
          { text: "Vue par secteur NAF : nb entreprises par tranche de taille", done: false },
          { text: "Filtres : secteur, taille minimum, région/département", done: false },
          { text: "Fiche entreprise : nom, SIRET, taille, adresse, secteur", done: false },
          { text: "Export liste entreprises filtrées (CSV ou CRM-ready)", done: false },
          { text: "── Phase 4 : Croisement avec sinistralité ──", done: false },
          { text: "Score d'opportunité : secteurs avec forte sinistralité ET grandes entreprises", done: false },
          { text: "Classement des secteurs prioritaires pour la prospection", done: false },
          { text: "Vue combinée : données AT/MP + nb entreprises cibles par secteur", done: false }
        ],
        links: [
          { url: "https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret", text: "Fichier stock SIRENE (data.gouv.fr)" },
          { url: "https://api.sirene.fr", text: "API SIRENE (INSEE)" }
        ]
      },
      {
        id: "bpo-study",
        title: "BPO Market Study",
        status: "not_started",
        description: "Étude de marché BPO.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "abonnement",
        title: "Abonnement GTM",
        status: "not_started",
        description: "Go-to-market de l'offre abonnement BPO en vue d'augmenter les volumes de ventes. T2.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "oav",
        title: "OAV New Offer Structure",
        status: "blocked",
        description: "Outils d'Aide à la Vente alignés avec le nouveau messaging et les brand guidelines. Garantir la cohérence du discours et la clarté de la proposition de valeur.",
        blockers: "Olivier et Éric Noël remettent en question la structure par service. Ils préfèrent des OAV parapluie moins ciblés. Si validé, une nouvelle série doit être conçue et approuvée avant de continuer.",
        notes: "",
        checklist: [
          { text: "── Prévention et Santé au Travail ──", done: false },
          { text: "Externaliser les visites médicales", done: true },
          { text: "Rattraper les visites médicales en retard", done: true },
          { text: "Évaluer les risques professionnels (DUERP)", done: false },
          { text: "Audits sécurité", done: false },
          { text: "── AT/MP ──", done: false },
          { text: "Déclarer un accident du travail (DAT)", done: true },
          { text: "Questionnaires de maladie professionnelle", done: true },
          { text: "Accidents causés par un tiers", done: false },
          { text: "Cotisations AT/MP", done: false },
          { text: "── Arrêts de Travail ──", done: false },
          { text: "Collecter les arrêts de travail", done: true },
          { text: "Récupérer les IJ", done: true },
          { text: "Remboursements IJSS et prévoyance", done: false },
          { text: "Piloter les arrêts longue durée", done: false },
          { text: "── Coûts RH ──", done: false },
          { text: "Charges sociales", done: true },
          { text: "Contrôle URSSAF", done: true },
          { text: "Aides apprentissage", done: true }
        ],
        links: [
          { url: "https://ayming-france.github.io/declarer-un-accident-du-travail/", text: "DAT" },
          { url: "https://ayming-france.github.io/collecte-et-traitement-des-arrets/", text: "Collecte Arrêts" },
          { url: "https://ayming-france.github.io/aides-apprentissage/", text: "Aides Apprentissage" },
          { url: "https://ayming-france.github.io/maitrise-des-charges-sociales/", text: "Charges Sociales" },
          { url: "https://ayming-france.github.io/accompagnement-controle-urssaf/", text: "Contrôle URSSAF" },
          { url: "https://ayming-france.github.io/visites-medicales/", text: "Visites Médicales" },
          { url: "https://ayming-france.github.io/rattrapage-visites-medicales/", text: "Rattrapage Visites Médicales" },
          { url: "https://ayming-france.github.io/questionnaires-de-maladie-professionnelle/", text: "Questionnaires MP" },
          { url: "https://ayming-france.github.io/recuperer-ij/", text: "Récupérer IJ" }
        ]
      }
    ]
  },
  {
    id: "acciline",
    title: "Module Risque Acciline",
    color: "#8b5cf6",
    status: "in_progress",
    description: "Optimiser le processus d'onboarding du module Risque afin de réduire le Time to Value de 25%.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "iprp",
        title: "IPRP Strategy",
        status: "not_started",
        description: "Stratégie IPRP.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "new-tool",
        title: "New Tool",
        status: "in_progress",
        description: "Nouvel outil codé en interne.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      },
      {
        id: "ttv",
        title: "Time to Value",
        status: "not_started",
        description: "Établir une baseline du temps moyen de déploiement avec les CSM. Formaliser un processus d'onboarding documenté et standardisé. Réduire le Time to Value de 25% par rapport à cette baseline.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      }
    ]
  },
  {
    id: "kpi",
    title: "KPI Performance MKT",
    color: "#ec4899",
    status: "not_started",
    description: "Contribuer à la livraison des KPI performance MKT et structurer le process Inbound MKT. T3.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: []
  },
  {
    id: "digital",
    title: "Ayming Academy",
    color: "#06b6d4",
    status: "not_started",
    description: "Formations obligatoires sur la plateforme digitale Ayming Academy. 3 briques corporate, 2 briques flex manager, 1 brique flex au choix.",
    blockers: "",
    notes: "",
    checklist: [
      { text: "── Briques corporate ──", done: false },
      { text: "Apporter une solution et pas seulement un problème", done: false },
      { text: "Les bases de la cybersécurité", done: false },
      { text: "Ayming AI : Chat, Transcribe, Translate", done: false },
      { text: "── Briques flex manager ──", done: false },
      { text: "Gestion de projet : Planification de projet", done: false },
      { text: "Renforcez votre communication persuasive", done: false },
      { text: "── Brique flex au choix ──", done: false },
      { text: "Donner un feedback positif et constructif", done: false }
    ],
    links: [],
    children: []
  }
];

// ──────────────────────────────────────────────
// STATUS LABELS
// ──────────────────────────────────────────────
export const STATUS_LABELS = {
  done: "Fait",
  in_progress: "En cours",
  blocked: "Bloqué",
  not_started: "Pas commencé"
};
