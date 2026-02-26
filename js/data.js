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
        status: "done",
        description: "Éliminer les leads sans source. 4 tags JS dans GTM forment une chaîne complète : capturer UTMs et Ads IDs à l'arrivée, les persister en localStorage (24h), les restaurer entre les pages, et bootstrapper automatiquement la source depuis le referrer (LLM, organic, referral) quand aucun UTM n'existe.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── Configuration ──", done: false },
          { text: "Cookie banner : consentement Ads IDs", done: true },
          { text: "── Tags UTM ──", done: false },
          { text: "cHTML - UTM link decoration (always)", done: true },
          { text: "cHTML - UTM storage + URL restore + first referrer", done: true },
          { text: "cHTML - No UTM Traffic Fallback", done: true },
          { text: "── Tags Ads ──", done: false },
          { text: "cHTML - Ads identifiers storage + URL restore", done: true }
        ],
        links: [
          { url: "https://ayming-france.github.io/mindmap/drafts/gtm-utm-link-decoration.md", text: "Tag : UTM link decoration" },
          { url: "https://ayming-france.github.io/mindmap/drafts/gtm-utm-storage-restore.md", text: "Tag : UTM storage + restore (mis à jour)" },
          { url: "https://ayming-france.github.io/mindmap/drafts/gtm-no-utm-fallback.md", text: "Tag : No UTM Fallback" },
          { url: "https://ayming-france.github.io/mindmap/drafts/gtm-ads-id-storage-restore.md", text: "Tag : Ads ID storage + restore" }
        ]
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
          { text: "── Contact : UTMs ──", done: false },
          { text: "Contact : utm_source", done: true },
          { text: "Contact : utm_medium", done: true },
          { text: "Contact : utm_campaign", done: true },
          { text: "Contact : utm_term", done: true },
          { text: "Contact : utm_content", done: true },
          { text: "── Contact : Ads IDs ──", done: false },
          { text: "Contact : gclid", done: false },
          { text: "Contact : gbraid", done: false },
          { text: "Contact : wbraid", done: false },
          { text: "Contact : msclkid", done: false },
          { text: "Contact : fbclid", done: false },
          { text: "Contact : li_fat_id", done: false },
          { text: "── Événements : UTMs ──", done: false },
          { text: "Événements : utm_source", done: false },
          { text: "Événements : utm_medium", done: false },
          { text: "Événements : utm_campaign", done: false },
          { text: "Événements : utm_term", done: false },
          { text: "Événements : utm_content", done: false },
          { text: "── Événements : Ads IDs ──", done: false },
          { text: "Événements : gclid", done: false },
          { text: "Événements : gbraid", done: false },
          { text: "Événements : wbraid", done: false },
          { text: "Événements : msclkid", done: false },
          { text: "Événements : fbclid", done: false },
          { text: "Événements : li_fat_id", done: false },
          { text: "── Téléchargements : UTMs ──", done: false },
          { text: "Téléchargements : utm_source", done: false },
          { text: "Téléchargements : utm_medium", done: false },
          { text: "Téléchargements : utm_campaign", done: false },
          { text: "Téléchargements : utm_term", done: false },
          { text: "Téléchargements : utm_content", done: false },
          { text: "── Téléchargements : Ads IDs ──", done: false },
          { text: "Téléchargements : gclid", done: false },
          { text: "Téléchargements : gbraid", done: false },
          { text: "Téléchargements : wbraid", done: false },
          { text: "Téléchargements : msclkid", done: false },
          { text: "Téléchargements : fbclid", done: false },
          { text: "Téléchargements : li_fat_id", done: false }
        ],
        links: []
      },
      {
        id: "confirmations",
        title: "Gestion Confirmations",
        status: "blocked",
        description: "300+ confirmations Gravity Forms (contact + événements + téléchargements) à nettoyer puis équiper avec les champs UTM cachés (Pass Field Data via Query String).",
        prerequisites: "GF Hidden Fields (Phase 2 : les champs doivent exister avant de configurer Pass Field Data)",
        blockers: "L'import Gravity Forms crée une copie du formulaire (pas de remplacement possible). La fonctionnalité 'formulaire par défaut' ne fonctionne plus après la migration. L'agence veut facturer la mise en place de cette fonctionnalité, un ticket a été fait à ce sujet.",
        notes: "Delphine prend en charge l'ajout des nouveaux champs UTM / Ads ID dans les form handlers Pardot. (contact + événements + téléchargements)",
        checklist: [
          { text: "── Phase 1 : Tri et nettoyage ──", done: false },
          { text: "Créer Google Sheet d'inventaire", done: true },
          { text: "Partager avec l'équipe pour validation", done: true },
          { text: "Contact : supprimer confirmations inutiles", done: false },
          { text: "Événements : supprimer confirmations inutiles", done: false },
          { text: "Téléchargements : supprimer confirmations inutiles", done: false },
          { text: "── Phase 2 : Export et Query String UTM ──", done: false },
          { text: "Contact : exporter JSON et remplacer Query String", done: false },
          { text: "Événements : exporter JSON et remplacer Query String", done: false },
          { text: "Téléchargements : exporter JSON et remplacer Query String", done: false },
          { text: "── Phase 3 : Import et mise à jour pages ──", done: false },
          { text: "Contact : réimporter formulaire", done: false },
          { text: "Contact : remplacer ancien formulaire par le nouveau sur les pages", done: false },
          { text: "Événements : réimporter formulaire", done: false },
          { text: "Événements : remplacer ancien formulaire par le nouveau sur les pages", done: false },
          { text: "Téléchargements : réimporter formulaire", done: false },
          { text: "Téléchargements : remplacer ancien formulaire par le nouveau sur les pages", done: false },
          { text: "── Phase 4 : Supprimer pages orphelines ──", done: false },
          { text: "Événements : supprimer pages orphelines des formulaires supprimés", done: false },
          { text: "Téléchargements : supprimer pages orphelines des formulaires supprimés", done: false }
        ],
        links: [
          { url: "https://docs.google.com/spreadsheets/d/1YL7N5aM5O-XncVKdqjGqbORJJlz9ul1OZeH02tciA0w/edit?gid=1509229921#gid=1509229921", text: "Inventaire Confirmations (Google Sheet)" }
        ]
      },
      {
        id: "pardot-fields",
        title: "Pardot Custom Fields",
        status: "done",
        description: "Créer les champs UTM et Ads IDs dans Pardot.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "utm_source", done: true },
          { text: "utm_medium", done: true },
          { text: "utm_campaign", done: true },
          { text: "utm_term", done: true },
          { text: "utm_content", done: true },
          { text: "gclid (Google Ads)", done: true },
          { text: "gbraid (Google Ads iOS)", done: true },
          { text: "wbraid (Google Ads web)", done: true },
          { text: "msclkid (Microsoft Ads)", done: true },
          { text: "fbclid (Facebook/Meta Ads)", done: true },
          { text: "li_fat_id (LinkedIn Ads)", done: true }
        ],
        links: []
      },
      {
        id: "pardot-handlers",
        title: "Pardot Form Handlers",
        status: "not_started",
        description: "Ajouter les champs UTM et Ads IDs à tous les form handlers Pardot (contact, événements, téléchargements). Suivi dans le Google Sheet d'inventaire.",
        prerequisites: "Pardot Custom Fields (les champs doivent exister avant de les ajouter aux handlers)",
        blockers: "",
        notes: "Delphine prend en charge l'ajout des nouveaux champs.",
        checklist: [
          { text: "── Contact ──", done: false },
          { text: "utm_source", done: false },
          { text: "utm_medium", done: false },
          { text: "utm_campaign", done: false },
          { text: "utm_term", done: false },
          { text: "utm_content", done: false },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads iOS)", done: false },
          { text: "wbraid (Google Ads web)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Facebook/Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false },
          { text: "Ajouter tag France", done: false },
          { text: "Domaine tracker (go.ayming.com vs go.ayming.fr)", done: false },
          { text: "Mettre à jour thank you page URL (redirections en place)", done: false },
          { text: "── Événements ──", done: false },
          { text: "utm_source", done: false },
          { text: "utm_medium", done: false },
          { text: "utm_campaign", done: false },
          { text: "utm_term", done: false },
          { text: "utm_content", done: false },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads iOS)", done: false },
          { text: "wbraid (Google Ads web)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Facebook/Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false },
          { text: "Ajouter tag France", done: false },
          { text: "Domaine tracker (go.ayming.com vs go.ayming.fr)", done: false },
          { text: "Mettre à jour thank you page URL (redirections en place)", done: false },
          { text: "── Téléchargements ──", done: false },
          { text: "utm_source", done: false },
          { text: "utm_medium", done: false },
          { text: "utm_campaign", done: false },
          { text: "utm_term", done: false },
          { text: "utm_content", done: false },
          { text: "gclid (Google Ads)", done: false },
          { text: "gbraid (Google Ads iOS)", done: false },
          { text: "wbraid (Google Ads web)", done: false },
          { text: "msclkid (Microsoft Ads)", done: false },
          { text: "fbclid (Facebook/Meta Ads)", done: false },
          { text: "li_fat_id (LinkedIn Ads)", done: false },
          { text: "Ajouter tag France", done: false },
          { text: "Domaine tracker (go.ayming.com vs go.ayming.fr)", done: false },
          { text: "Mettre à jour thank you page URL (redirections en place)", done: false }
        ],
        links: [
          { url: "https://docs.google.com/spreadsheets/d/1YL7N5aM5O-XncVKdqjGqbORJJlz9ul1OZeH02tciA0w/edit?gid=1509229921#gid=1509229921", text: "Inventaire Form Handlers (Google Sheet)" }
        ]
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
      },
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
            status: "done",
            description: "Réécrire llms.txt avec du contexte structuré. Actuellement c'est un dump de 300+ URLs d'articles généré par RankMath. Un LLM qui lit ce fichier ne sait toujours pas ce qu'Ayming fait ni vend.",
            prerequisites: "robots.txt (les bots doivent pouvoir accéder au fichier)",
            blockers: "",
            notes: "",
            checklist: [
              { text: "Ajouter section About (description, date création, employés, pays)", done: true },
              { text: "Ajouter section Services (4 verticales avec liens directs par offre)", done: true },
              { text: "Ajouter proof points par verticale (nb clients, dossiers, € récupérés)", done: true },
              { text: "Ajouter section Contact (formulaire, adresse)", done: true },
              { text: "Supprimer le dump d'articles RankMath", done: true },
              { text: "Configurer dans Rank Math > General Settings > LLMs.txt", done: true }
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
      },
      {
        id: "metrics-validation",
        title: "Métriques Pages Offres",
        status: "not_started",
        description: "Demande de Marion Constanza : vérifier que les chiffres affichés sur les pages famille et les pages offres individuelles sont corrects et à jour. Ces métriques alimentent aussi le llms.txt et le schema JSON-LD.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "── Prévention (page famille) ──", done: false },
          { text: "15 000+ visites planifiées/an", done: false },
          { text: "250 000+ salariés suivis", done: false },
          { text: "3 500+ DUERP mis à jour", done: false },
          { text: "1 200+ diagnostics sécurité", done: false },
          { text: "── AT/MP (page famille) ──", done: false },
          { text: "35 000+ DAT/an", done: false },
          { text: "500 000+ salariés suivis", done: false },
          { text: "1 800 dossiers MP/an", done: false },
          { text: "120 M€ d'économies cotisations", done: false },
          { text: "── Arrêts de travail (page famille) ──", done: false },
          { text: "45 000+ arrêts traités/an", done: false },
          { text: "320 000+ salariés suivis", done: false },
          { text: "18 M€ d'IJ récupérées", done: false },
          { text: "12 500+ arrêts longue durée pilotés", done: false },
          { text: "── Coûts RH (page famille) ──", done: false },
          { text: "45 M€ d'économies", done: false },
          { text: "850+ entreprises accompagnées", done: false },
          { text: "320+ contrôles URSSAF gérés", done: false },
          { text: "── Pages offres individuelles ──", done: false },
          { text: "Vérifier chiffres sur chaque page offre Prévention (4 pages)", done: false },
          { text: "Vérifier chiffres sur chaque page offre AT/MP (4 pages)", done: false },
          { text: "Vérifier chiffres sur chaque page offre Arrêts (4 pages)", done: false },
          { text: "Vérifier chiffres sur chaque page offre Coûts RH (3 pages)", done: false }
        ],
        links: []
      },
      {
        id: "offer-launch-process",
        title: "Procédure Lancement Offre",
        status: "not_started",
        description: "Définir le processus standard de lancement d'une offre sur le marché : étapes, règles, rôles, livrables et critères de validation. L'objectif est d'avoir une procédure reproductible pour chaque nouvelle offre.",
        blockers: "",
        notes: "",
        checklist: [],
        links: []
      }
    ]
  },
  {
    id: "acciline",
    title: "Acciline+",
    color: "#8b5cf6",
    status: "in_progress",
    description: "Optimiser le processus d'onboarding du module Risque afin de réduire le Time to Value de 25%.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "module-risque",
        title: "Module Risque",
        status: "in_progress",
        description: "Module Risque d'Acciline+.",
        blockers: "",
        notes: "",
        checklist: [],
        links: [],
        children: [
          {
            id: "iprp",
            title: "IPRP Offer",
            status: "not_started",
            description: "Stratégie IPRP.",
            blockers: "",
            notes: "",
            checklist: [],
            links: []
          },
          {
            id: "import-tool",
            title: "Import Tool",
            status: "in_progress",
            description: "Nouvel outil d'import codé en interne.",
            blockers: "",
            notes: "",
            checklist: [],
            links: []
          }
        ]
      }
    ]
  },
  {
    id: "kpi",
    title: "KPI Performance MKT",
    color: "#ec4899",
    status: "in_progress",
    description: "Contribuer à la livraison des KPI performance MKT et structurer le process Inbound MKT. T3.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "sf-stranded-recovery",
        title: "Récupération Activités Orphelines",
        status: "in_progress",
        description: "Récupération des leads/contacts ayant une Primary Campaign Source dans leurs activités (Events, Tasks, Calls) mais absents des CampaignMembers. Processus automatisé via la skill Claude 'salesforce-data'.",
        blockers: "",
        notes: "",
        checklist: [],
        links: [],
        children: [
          {
            id: "sf-ad2025-acciline",
            title: "Acciline",
            status: "done",
            description: "123 membres récupérés le 26/02/2026.<br><br>• AD 2025 - TEL - Prospection : 89<br>• AD 2025 - ACB - CSM : 9<br>• AD 2025 - EVT - Webinaire HSE : 7<br>• AD 2025 - ACB - Upsell / Cross Sell : 6<br>• AD 2025 - EVT - Preventica Paris : 6<br>• AD 2025 - REQ - Acciline FR : 3<br>• AD 2025 - TEL - Prospection CRM : 3",
            blockers: "",
            notes: "",
            checklist: [],
            links: []
          },
          {
            id: "sf-ayming-france",
            title: "Ayming France",
            status: "not_started",
            description: "",
            checklist: [],
            links: []
          }
        ]
      }
    ]
  },
  {
    id: "digital",
    title: "Ayming Academy",
    color: "#06b6d4",
    status: "not_started",
    description: "Formations obligatoires sur la plateforme digitale Ayming Academy. 3 briques corporate, 2 briques flex manager, 1 brique flex au choix.",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "academy-corporate",
        title: "Briques Corporate",
        status: "not_started",
        description: "3 briques corporate obligatoires.",
        blockers: "Je n'arrive pas à trouver facilement ces liens dans le moteur de recherche :<br><ul><li>Apporter une solution et pas seulement un problème (fonction corporate)</li><li>Les bases de la cybersécurité</li></ul>",
        checklist: [
          { text: "── Apporter une solution / Relation client ──", done: false },
          { text: "Apporter une solution et pas seulement un problème (fonction corporate)", done: false },
          { text: "Prêt à développer votre relation client chez Ayming (ventes et conseil)", done: false },
          { text: "── Cybersécurité ──", done: false },
          { text: "Les bases de la cybersécurité", done: false },
          { text: "── Ayming AI ──", done: false },
          { text: "Ayming AI - Chat", done: false },
          { text: "Ayming AI - Transcribe", done: false },
          { text: "Ayming AI - Translate", done: false }
        ],
        links: [
          { url: "https://www.aymingacademy.com/learn/courses/2475/ayming-chat", text: "Ayming Chat" },
          { url: "https://www.aymingacademy.com/learn/courses/2476/ayming-transcribe", text: "Ayming Transcribe" },
          { url: "https://www.aymingacademy.com/learn/courses/2474/ayming-translate", text: "Ayming Translate" },
          { url: "https://www.aymingacademy.com/learn/courses/2470/fr-pret-a-developper-vos-talents-commerciaux-chez-ayming", text: "Prêt à développer vos talents commerciaux" }
        ]
      },
      {
        id: "academy-flex-manager",
        title: "Briques Flex Manager",
        status: "not_started",
        description: "2 briques flex proposées par votre manager.",
        checklist: [
          { text: "Gestion de projet : Planification de projet | Project Management: Project planning (FR)", done: false },
          { text: "Renforcez votre communication persuasive (Enhance your persuasive communication skills)", done: false }
        ],
        links: []
      },
      {
        id: "academy-flex-choix",
        title: "Brique Flex au Choix",
        status: "not_started",
        description: "1 brique flex de votre choix.",
        checklist: [
          { text: "Donner un feedback positif et constructif (Giving positive and constructive feedback)", done: false }
        ],
        links: [
          { url: "https://www.aymingacademy.com/learn/courses/1221/donner-un-feedback-positif-et-constructif-giving-positive-and-constructive-feedback", text: "Donner un feedback positif et constructif" }
        ]
      }
    ]
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

// ──────────────────────────────────────────────
// DEFAULT POSITIONS (cross-device layout)
// Updated via diff export: paste the _positions object here
// ──────────────────────────────────────────────
export const DEFAULT_POSITIONS = {
  "attribution": { "x": 1027.16, "y": 495.57 },
  "gtm-tags": { "x": 793.16, "y": 305.57 },
  "gf-hidden-fields": { "x": 793.16, "y": 369.57 },
  "campaign-tracker": { "x": 793.16, "y": 433.57 },
  "confirmations": { "x": 793.16, "y": 497.57 },
  "pardot-fields": { "x": 793.16, "y": 561.57 },
  "pardot-handlers": { "x": 793.16, "y": 625.57 },
  "sf-fields": { "x": 793.16, "y": 689.57 },
  "website": { "x": 1785.17, "y": 565.39 },
  "seo": { "x": 2019.17, "y": 352.39 },
  "offsite": { "x": 2019.17, "y": 416.39 },
  "ga4": { "x": 2019.17, "y": 480.39 },
  "geo": { "x": 2019.17, "y": 681.39 },
  "geo-robots": { "x": 2227.17, "y": 590.39 },
  "geo-llms": { "x": 2227.17, "y": 654.39 },
  "geo-schema": { "x": 2227.17, "y": 718.39 },
  "geo-redirects": { "x": 2227.17, "y": 782.39 },
  "module-risque": { "x": 1888.83, "y": 889.28 },
  "iprp": { "x": 2096.83, "y": 862.28 },
  "import-tool": { "x": 2096.83, "y": 926.28 },
  "digital": { "x": 1838.01, "y": 1096.16 },
  "academy-corporate": { "x": 2072.01, "y": 1034.16 },
  "academy-flex-manager": { "x": 2072.01, "y": 1098.16 },
  "academy-flex-choix": { "x": 2072.01, "y": 1162.16 },
  "kpi": { "x": 1195.45, "y": 1134.42 },
  "sf-stranded-recovery": { "x": 961.45, "y": 1154.42 },
  "sf-ad2025-acciline": { "x": 753.45, "y": 1127.42 },
  "sf-ayming-france": { "x": 753.45, "y": 1191.42 }
};
